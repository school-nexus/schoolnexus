const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function kebabCase(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .replace(/([a-z])([0-9])/gi, '$1-$2')
        .toLowerCase();
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanged = false;

    // 1. Fix existing optimized imports that are missing .js OR have bad kebab mapping (e.g. trash2.js instead of trash-2.js)
    const fixRegex = /import\s+([A-Za-z0-9_]+)\s+from\s+['"]lucide-react\/dist\/esm\/icons\/([^'"]+)(?:\.js)?['"]/g;
    let match;
    while ((match = fixRegex.exec(content)) !== null) {
        const fullMatch = match[0];
        const alias = match[1];
        const currentPath = match[2];
        const correctKebab = kebabCase(alias);
        const correctPath = `${correctKebab}.js`;
        
        if (currentPath !== correctKebab && currentPath !== correctPath) {
            content = content.replace(fullMatch, `import ${alias} from 'lucide-react/dist/esm/icons/${correctPath}'`);
            hasChanged = true;
        } else if (!fullMatch.endsWith(".js'\"") && !fullMatch.endsWith(".js'")) {
             // ensure it ends with .js
             content = content.replace(fullMatch, `import ${alias} from 'lucide-react/dist/esm/icons/${correctPath}'`);
             hasChanged = true;
        }
    }

    // 2. Process standard named imports
    if (content.includes("'lucide-react'") || content.includes('"lucide-react"')) {
        const regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const fullMatch = match[0];
            const iconsText = match[1];
            
            // Skip if it's just types
            if (iconsText.includes('type ')) {
                // We keep it as is or handle it specifically if needed, 
                // but for now let's just skip if it's ONLY types.
                // If it's a mix, we might have issues.
            }

            const icons = iconsText.split(',').map(i => i.trim()).filter(i => i && !i.startsWith('type '));
            if (icons.length === 0) continue;

            const newImports = icons.map(icon => {
                const parts = icon.split(/\s+as\s+/);
                const iconName = parts[0].trim();
                const alias = parts[1] ? parts[1].trim() : iconName;
                const kebab = kebabCase(iconName);
                return `import ${alias} from 'lucide-react/dist/esm/icons/${kebab}.js';`;
            }).join('\n');

            content = content.replace(fullMatch, newImports);
            hasChanged = true;
        }
    }

    if (hasChanged) {
        console.log(`Optimized: ${filePath}`);
        fs.writeFileSync(filePath, content);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walk(srcDir);
console.log('Done!');
