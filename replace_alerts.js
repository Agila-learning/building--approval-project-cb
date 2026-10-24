const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'frontend', 'src');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('alert(')) {
                if (!content.includes("import toast from 'react-hot-toast';")) {
                    const importMatch = content.match(/^import .*?;/gm);
                    if (importMatch) {
                        const lastImport = importMatch[importMatch.length - 1];
                        content = content.replace(lastImport, lastImport + "\nimport toast from 'react-hot-toast';");
                    } else {
                        content = "import toast from 'react-hot-toast';\n" + content;
                    }
                }
                
                content = content.replace(/alert\((['"])(.*?[Ff]ail.*?)['"]\)/g, "toast.error($1$2$1)");
                content = content.replace(/alert\((['"])(.*?[Ee]rror.*?)['"]\)/g, "toast.error($1$2$1)");
                content = content.replace(/alert\((['"])(.*?[Ii]nvalid.*?)['"]\)/g, "toast.error($1$2$1)");
                content = content.replace(/alert\(/g, "toast.success(");

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    }
}

processDirectory(directory);
