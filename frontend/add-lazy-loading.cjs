const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let modifiedCount = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (!filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Replace <img ...> with <img loading="lazy" decoding="async" ...>
  // But avoid replacing if it already has loading="lazy"
  const newContent = content.replace(/<img\s([^>]+)>/g, (match, attrs) => {
    if (attrs.includes('loading=')) return match;
    
    hasChanges = true;
    return `<img loading="lazy" decoding="async" ${attrs}>`;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    modifiedCount++;
    console.log(`Updated ${filePath}`);
  }
});

console.log(`Done. Modified ${modifiedCount} files.`);
