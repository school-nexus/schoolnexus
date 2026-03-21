const fs = require('fs');
const path = require('path');

const dirsToClean = [
  'dist',
  'dist-electron',
  '.next',
  'out'
];

console.log('Cleaning build artifacts...');

dirsToClean.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      console.log(`Removing ${dir}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to remove ${dir}:`, err.message);
    }
  }
});

console.log('Clean completed.');
