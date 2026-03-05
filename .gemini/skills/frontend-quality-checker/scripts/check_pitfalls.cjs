const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('
');
    let issues = [];

    // 1. Check for duplicate imports from the same source
    const importMap = {};
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const symbols = match[1].split(',').map(s => s.trim());
        const source = match[2];
        if (!importMap[source]) importMap[source] = new Set();
        
        symbols.forEach(symbol => {
            if (importMap[source].has(symbol)) {
                issues.push(`Duplicate import: "${symbol}" from "${source}"`);
            }
            importMap[source].add(symbol);
        });
    }

    // 2. Check for direct fetch/axios calls (ignoring centralized api.ts)
    if (!filePath.endsWith('api.ts') && !filePath.endsWith('test.tsx') && !filePath.endsWith('test.ts')) {
        if (content.includes('fetch(') && !content.includes('fetchApi')) {
            issues.push('Direct fetch() call detected. Use fetchApi instead.');
        }
        if (content.includes('axios.')) {
            issues.push('Direct axios call detected. Use fetchApi or central axios instance.');
        }
    }

    return issues;
}

const dirToCheck = process.argv[2] || 'src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                const fileIssues = checkFile(file);
                if (fileIssues.length > 0) {
                    results.push({ file, issues: fileIssues });
                }
            }
        }
    });
    return results;
}

console.log(`Scanning ${dirToCheck}...`);
const allIssues = walk(dirToCheck);

if (allIssues.length > 0) {
    allIssues.forEach(item => {
        console.log(`\nFile: ${item.file}`);
        item.issues.forEach(issue => console.log(`  - [ISSUE] ${issue}`));
    });
} else {
    console.log("No common pitfalls detected!");
}
console.log("\nQuality check complete.");
