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

const packagejson = require('./package.json');

const folders = getFoldersWithPackageJson(entry)
  .map(p => {
    const packageJson = path.join(p, 'package.json');
    const json = require(packageJson);
    return { json, path: p };
  })
  .filter(data => {
    return !data.json.private;
  })
  .map(data => {
    const packageJson = path.join(data.path, 'package.json');
    const json = require(packageJson);
    const pathList = Object.values(json.exports).map(p =>
      path.join(data.path, p)
    );
    return {
      name: data.json.name,
      path: pathList,
      ignore: Object.keys({
        ...packagejson.dependencies,
        ...packagejson.devDependencies,
        ...data.json.dependencies,
        ...data.json.devDependencies,
      }),
    };
  });

module.exports = folders;
