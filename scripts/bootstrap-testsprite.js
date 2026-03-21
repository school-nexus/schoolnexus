import fs from 'fs';
import path from 'path';

const projectPath = process.cwd();
const configDir = path.join(projectPath, '.testsprite');
const configFile = path.join(configDir, 'config.json');

if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

const config = {
    status: 'init',
    type: 'frontend',
    scope: 'all',
    localEndpoint: 'http://localhost:3000/',
    serverMode: 'development'
};

fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

console.log('✅ TestSprite configuration initialized at .testsprite/config.json');
console.log('Next steps:');
console.log('1. Ensure your local server is running on http://localhost:3000');
console.log('2. Run: npx @testsprite/testsprite-mcp generateCodeAndExecute');
