const path = require('path');
const fs = require('fs');

const entry = path.resolve(__dirname, 'packages');

function getFoldersWithPackageJson(dir) {
  let folders = [];

  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item.includes('node_modules') || item.includes('src')) {
      break;
    }
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (fs.existsSync(path.join(fullPath, 'package.json'))) {
        folders.push(fullPath);
      }
      folders = folders.concat(getFoldersWithPackageJson(fullPath));
    }
  }

  return folders;
}

const folders = getFoldersWithPackageJson(entry)
  .map(p => {
    const packageJson = path.join(p, 'package.json');
    const json = require(packageJson);
    return { json, path: p };
  })
  .filter(data => {
    return !data.json.private;
  })
  .filter(data => {
    // We only want to include packages that need to be installed by the user
    return ['@blocksuite/affine'].includes(data.json.name);
  })
  .flatMap(data => {
    const pathList = Object.entries(data.json.exports).map(([key, p]) => {
      return {
        path: path.join(data.path, p),
        subpath: key,
      };
    });
    const ignore = Object.keys({
      ...data.json.dependencies,
      ...data.json.devDependencies,
    }).filter(name => !name.startsWith('@blocksuite/'));
    return pathList.map(p => ({
      name: path.join(data.json.name, p.subpath),
      path: p.path,
      ignore,
    }));
  });

module.exports = folders;
