const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
const upload = multer({ dest: 'uploads/' });

// --- MIDDLEWARE SETUP ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Essential for APK JSON requests
app.use(session({
    secret: 'super_secret_security_key_123',
    resave: false,
    saveUninitialized: false
}));

// Serve Static Frontend Assets (dist/ index & PWA files)
app.use(express.static(path.join(__dirname, 'dist')));

// --- DATABASE SETUP (SQLite) ---
const db = new sqlite3.Database('./app_data.db', (err) => {
    if (err) console.error("Database connection error:", err);
    else console.log("Connected to SQLite Database.");
});

db.serialize(() => {
    // Clients
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT UNIQUE,
        admin_email TEXT
    )`);

    // System Users (Admins, Supervisors, Security)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        name TEXT,
        identifier TEXT UNIQUE, -- Email or Phone Number
        password TEXT,
        role TEXT, -- 'SUPERADMIN', 'CLIENT_ADMIN', 'SUPERVISOR', 'SECURITY'
        FOREIGN KEY(client_id) REFERENCES clients(id)
    )`);

    // Employee Data (Uploaded via Excel from Main UI)
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        emp_code TEXT,
        name TEXT,
        department TEXT,
        phone TEXT,
        FOREIGN KEY(client_id) REFERENCES clients(id)
    )`);

    // Field Operations Data (From Mobile APK)
    db.run(`CREATE TABLE IF NOT EXISTS field_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        emp_id INTEGER,
        status TEXT, -- 'CHECKED_IN', 'CHECKED_OUT'
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Demo Data
    const hashedPassword = bcrypt.hashSync("123456", 10);
    db.run(`INSERT OR IGNORE INTO clients (id, company_name, admin_email) VALUES (1, 'Apex Industrial Services', 'clientadmin@apex.com')`);
    db.run(`INSERT OR IGNORE INTO users (id, client_id, name, identifier, password, role) VALUES 
        (1, 1, 'Client Admin', 'clientadmin@apex.com', '${hashedPassword}', 'CLIENT_ADMIN'),
        (2, 1, 'Site Supervisor', '9876543210', '${hashedPassword}', 'SUPERVISOR')`);
});

// --- AUTHENTICATION MIDDLEWARE ---
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

// ==========================================
// 🌐 WEB PORTAL (Main UI Dashboard)
// ==========================================

// Login Page
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SrijanDev Portal - Login</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0b1c30; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-card { background: #132742; padding: 30px; border-radius: 12px; border: 1px solid #27446b; box-shadow: 0 8px 24px rgba(0,0,0,0.3); width: 340px; }
                h2 { color: #90a8ff; margin-top: 0; text-align: center; }
                p { font-size: 12px; color: #a0aec0; text-align: center; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; margin: 8px 0; background: #0b1c30; border: 1px solid #27446b; border-radius: 6px; color: #fff; box-sizing: border-box; outline: none; }
                input:focus { border-color: #90a8ff; }
                button { width: 100%; padding: 12px; background: #00236f; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; transition: 0.2s; }
                button:hover { background: #1e3a8a; }
                .demo-box { margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 11px; color: #cbd5e1; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h2>SrijanDev Operations</h2>
                <p>Security Field Force Manager</p>
                <form action="/login" method="POST">
                    <input type="text" name="identifier" placeholder="Email or Mobile No." required />
                    <input type="password" name="password" placeholder="Password" required />
                    <button type="submit">Login to Portal</button>
                </form>
                <div class="demo-box">
                    <b>Demo Credentials:</b><br/>
                    • Admin: <code>clientadmin@apex.com</code> | Pass: <code>123456</code><br/>
                    • Supervisor: <code>9876543210</code> | Pass: <code>123456</code>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { identifier, password } = req.body;
    db.get(`SELECT * FROM users WHERE identifier = ?`, [identifier], (err, user) => {
        if (err || !user) return res.send("User not found.");
        
        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = { id: user.id, client_id: user.client_id, name: user.name, role: user.role };
            res.redirect('/portal');
        } else {
            res.send("Invalid credentials.");
        }
    });
});

// MAIN UI / DASHBOARD (Upload Excel directly on Home Screen)
app.get('/portal', isAuthenticated, (req, res) => {
    const user = req.session.user;

    // Fetch this client's employees
    db.all(`SELECT * FROM employees WHERE client_id = ?`, [user.client_id], (err, employees) => {
        // Fetch field operations logged via Mobile APK
        db.all(`SELECT f.timestamp, f.status, e.name, e.emp_code 
                FROM field_operations f 
                JOIN employees e ON f.emp_id = e.id 
                WHERE f.client_id = ? ORDER BY f.id DESC LIMIT 10`, 
        [user.client_id], (err, apkLogs) => {

            let empRows = (employees || []).map(e => `
                <tr>
                    <td><b>${e.emp_code}</b></td>
                    <td>${e.name}</td>
                    <td>${e.department}</td>
                    <td>${e.phone}</td>
                </tr>
            `).join('') || `<tr><td colspan="4" style="text-align:center; color: #888;">No employees uploaded yet. Please upload an Excel sheet above.</td></tr>`;

            let logRows = (apkLogs || []).map(l => `
                <tr>
                    <td>${l.timestamp}</td>
                    <td>${l.emp_code} - ${l.name}</td>
                    <td><span style="padding: 3px 8px; border-radius: 4px; background: ${l.status === 'CHECKED_IN' ? '#d4edda' : '#f8d7da'}; color: ${l.status === 'CHECKED_IN' ? '#155724' : '#721c24'}; font-weight: bold;">${l.status}</span></td>
                </tr>
            `).join('') || `<tr><td colspan="3" style="text-align:center; color: #888;">No APK field operations recorded today.</td></tr>`;

            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>SrijanDev Main Dashboard</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #eef2f5; margin: 0; padding: 20px; }
                        .header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                        .upload-box { border: 2px dashed #007bff; padding: 20px; text-align: center; border-radius: 8px; background: #f8fbff; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background: #f1f3f5; }
                        .btn-upload { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                    </style>
                </head>
                <body>

                    <div class="header">
                        <h2>SrijanDev Client Portal - Dashboard</h2>
                        <div>Welcome, <b>${user.name}</b> (${user.role}) | <a href="/" style="color: blue; margin-right: 15px;">Main UI</a> | <a href="/logout" style="color: red;">Logout</a></div>
                    </div>

                    <!-- MAIN UI EXCEL UPLOAD BOX -->
                    <div class="card">
                        <h3>📤 Quick Excel Upload (Employee Roster)</h3>
                        <p style="color: #666; font-size: 14px;">Upload an Excel sheet (.xlsx) containing columns: <b>EmpCode, Name, Department, Phone</b></p>
                        <form action="/upload-excel" method="POST" enctype="multipart/form-data" class="upload-box">
                            <input type="file" name="excel_file" accept=".xlsx, .xls" required />
                            <button type="submit" class="btn-upload">Upload &amp; Sync Roster</button>
                        </form>
                    </div>

                    <!-- CLIENT EMPLOYEE ROSTER -->
                    <div class="card">
                        <h3>👥 Active Employee Roster (${(employees || []).length})</h3>
                        <table>
                            <tr><th>Emp Code</th><th>Name</th><th>Department</th><th>Phone</th></tr>
                            ${empRows}
                        </table>
                    </div>

                    <!-- LIVE FIELD OPERATIONS (FROM MOBILE APK) -->
                    <div class="card">
                        <h3>📱 Live Field Operations (APK Activity)</h3>
                        <table>
                            <tr><th>Time</th><th>Employee</th><th>Status</th></tr>
                            ${logRows}
                        </table>
                    </div>

                </body>
                </html>
            `);
        });
    });
});

// Excel Upload POST Endpoint
app.post('/upload-excel', isAuthenticated, upload.single('excel_file'), (req, res) => {
    if (!req.file) return res.send("Please select an Excel file.");

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const clientId = req.session.user.client_id;

    const stmt = db.prepare(`INSERT INTO employees (client_id, emp_code, name, department, phone) VALUES (?, ?, ?, ?, ?)`);
    db.serialize(() => {
        data.forEach(row => {
            stmt.run(clientId, row.EmpCode || '', row.Name || '', row.Department || '', row.Phone || '');
        });
        stmt.finalize();
    });

    res.redirect('/portal');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ==========================================
// 📱 MOBILE APK API ENDPOINTS
// ==========================================

app.post('/api/apk/login', (req, res) => {
    const { identifier, password } = req.body;
    db.get(`SELECT id, client_id, name, role, password FROM users WHERE identifier = ?`, [identifier], (err, user) => {
        if (err || !user) return res.status(400).json({ success: false, message: "User not found" });

        if (bcrypt.compareSync(password, user.password)) {
            res.json({
                success: true,
                message: "Login successful",
                user: { id: user.id, client_id: user.client_id, name: user.name, role: user.role }
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid password" });
        }
    });
});

app.get('/api/apk/employees/:client_id', (req, res) => {
    const clientId = req.params.client_id;
    db.all(`SELECT id, emp_code, name, department, phone FROM employees WHERE client_id = ?`, [clientId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows });
    });
});

app.post('/api/apk/mark-operation', (req, res) => {
    const { client_id, emp_id, status } = req.body;
    
    if (!client_id || !emp_id || !status) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    db.run(`INSERT INTO field_operations (client_id, emp_id, status) VALUES (?, ?, ?)`, 
    [client_id, emp_id, status], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "Field entry recorded successfully", log_id: this.lastID });
    });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Main Portal Dashboard: http://localhost:${PORT}/portal`);
    console.log(`APK Mobile APIs Active on /api/apk/`);
});
