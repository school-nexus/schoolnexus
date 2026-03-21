const { spawn } = require('child_process');
const path = require('path');

console.log('Starting drizzle-kit generate with automated inputs...');

const child = spawn('npx.cmd', ['drizzle-kit', 'generate'], { 
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd()
});

// Send a bunch of newlines to accept all default "create table" options
const sendInputs = () => {
    for (let i = 0; i < 20; i++) {
        child.stdin.write('\n');
    }
    child.stdin.end();
};

// Wait a bit for the process to start and show first prompt
setTimeout(sendInputs, 2000);

child.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
});

child.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
});

child.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
    process.exit(code);
});
