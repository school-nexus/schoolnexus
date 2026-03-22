const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('page.tsx') || file.endsWith('route.ts') || file.endsWith('route.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'src/app'));
let modified = 0;

for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    if (!content.includes("runtime = 'edge'") && 
        !content.includes('runtime = "edge"') && 
        !content.includes('runtime="edge"') && 
        !content.includes("runtime='edge'") &&
        !content.includes("runtime = 'experimental-edge'")) {
        fs.writeFileSync(f, "export const runtime = 'edge';\n" + content);
        modified++;
    }
}
console.log(`Modified ${modified} files.`);
