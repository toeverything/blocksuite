import type { API, FileInfo } from 'jscodeshift';

/**
 */
export default function (fileInfo: FileInfo, api: API) {
  const j = api.j;
  const root = j(fileInfo.source);

  root.find(j.ImportDeclaration).forEach(path => {
    let existFlag = false;
    path.node.specifiers = path.node.specifiers?.filter(specifier => {
      if (
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.name === 'PointLocation'
      ) {
        existFlag = true;
        return false;
      }

      return true;
    });

    if (existFlag) {
      if (path.node.specifiers?.length === 0) {
        j(path).remove();
      }

      const newImport = j.importDeclaration(
        [j.importSpecifier(j.identifier('PointLocation'))],
        j.literal('@blocksuite/global/utils')
      );

      // Insert the new import statement at the beginning of the file
      root.get().node.program.body.unshift(newImport);
    }
  });

  return root.toSource();
}
