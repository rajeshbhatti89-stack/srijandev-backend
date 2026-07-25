const { execSync } = require('child_process');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
console.log('Deploying dist folder live to public domain...');

try {
  const result = execSync('npx surge dist --domain sentinel-pro-field-force.surge.sh', {
    cwd: __dirname,
    encoding: 'utf8',
    env: { ...process.env, PATH: process.env.PATH }
  });
  console.log(result);
} catch (err) {
  console.log('Surge deploy error:', err.message);
}
