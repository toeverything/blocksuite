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
  .map(data => ({
    name: data.json.name,
    path: [path.join(data.path, 'src', '!(__tests__)', '**', '*.ts')],
    ignore: Object.keys({
      ...packagejson.dependencies,
      ...packagejson.devDependencies,
      ...data.json.dependencies,
      ...data.json.devDependencies,
    }),
  }));

module.exports = folders;

// module.exports = [
//   {
//     name: '@blocksuite/global',
//     path: 'packages/framework/global/dist',
//   },
//   {
//     name: '@blocksuite/store',
//     path: 'packages/framework/store/dist',
//   },
//   {
//     name: '@blocksuite/block-std',
//     path: 'packages/framework/block-std/dist',
//   },
//   {
//     name: '@blocksuite/inline',
//     path: 'packages/framework/inline/dist',
//   },
//   {
//     name: '@blocksuite/sync',
//     path: 'packages/framework/sync/dist',
//   },
//   {
//     name: '@blocksuite/affine-shared',
//     path: 'packages/affine/shared/dist',
//   },
//   {
//     name: '@blocksuite/affine-model',
//     path: 'packages/affine/model/dist',
//   },
//   {
//     name: '@blocksuite/affine-components',
//     path: 'packages/affine/components/dist',
//   },
//   {
//     name: '@blocksuite/affine-block-list',
//     path: 'packages/affine/block-list/dist',
//   },
//   {
//     name: '@blocksuite/affine-block-paragraph',
//     path: 'packages/affine/block-paragraph/dist',
//   },
//   {
//     name: '@blocksuite/affine-block-surface',
//     path: 'packages/affine/block-surface/dist',
//   },
//   {
//     name: '@blocksuite/data-view',
//     path: 'packages/affine/data-view/dist',
//   },
//   {
//     name: '@blocksuite/blocks',
//     path: 'packages/presets/dist',
//   },
//   {
//     name: '@blocksuite/presets',
//     path: 'packages/presets/dist',
//   },
// ];
