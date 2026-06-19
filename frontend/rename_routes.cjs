const fs = require('fs');
const path = require('path');

const dirToProcess = 'c:\\syscraft\\onlyMans\\frontend\\src';

const routeMap = [
  { old: '/dashboard', new: '/user/dashboard' },
  { old: '/explore', new: '/user/explore' },
  { old: '/subscriptions', new: '/user/subscriptions' },
  { old: '/favorites', new: '/user/favorites' },
  { old: '/become-creator', new: '/user/become-creator' },
  { old: '/creator-studio', new: '/creator/studio' },
  { old: '/create-post', new: '/creator/create-post' },
  { old: '/creator-subscribers', new: '/creator/subscribers' },
  { old: '/creator-settings', new: '/creator/settings' },
  { old: '/view-profile', new: '/creator-profile' },
  { old: '/profile', new: '/user/profile' }
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const {old, new: newRoute} of routeMap) {
        // Replace to="/route" or to="/route?xyz"
        const regex1 = new RegExp(`to="${old}([\/?"][^"]*)?"`, 'g');
        content = content.replace(regex1, (match, p1) => `to="${newRoute}${p1 || ''}"`);
        
        const regex2 = new RegExp(`to={'${old}([\/?'][^']*)?'}`, 'g');
        content = content.replace(regex2, (match, p1) => `to={'${newRoute}${p1 || ''}'}`);
        
        const regex3 = new RegExp(`to={\`${old}([\/?\`][^\`]*)?\``, 'g');
        content = content.replace(regex3, (match, p1) => `to={\`${newRoute}${p1 || ''}\``);

        const regex4 = new RegExp(`navigate\\('${old}([\/?'][^']*)?'\\)`, 'g');
        content = content.replace(regex4, (match, p1) => `navigate('${newRoute}${p1 || ''}')`);

        const regex5 = new RegExp(`navigate\\("${old}([\/?"][^"]*)?"\\)`, 'g');
        content = content.replace(regex5, (match, p1) => `navigate("${newRoute}${p1 || ''}")`);

        const regex6 = new RegExp(`navigate\\(\`${old}([\/?\`][^\`]*)?\``, 'g');
        content = content.replace(regex6, (match, p1) => `navigate(\`${newRoute}${p1 || ''}\``);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated routes in: ${fullPath}`);
      }
    }
  }
}

processDirectory(dirToProcess);
console.log('Route update complete.');
