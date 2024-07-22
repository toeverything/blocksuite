import type { API, ASTPath, FileInfo } from 'jscodeshift';

/**
 */
export default function (fileInfo: FileInfo, api: API) {
  const j = api.j;
  const root = j(fileInfo.source);

  root.find(j.ImportDeclaration).forEach(path => {
    const existModules: string[] = [];
    let globalImportPath: ASTPath;

    path.node.specifiers = path.node.specifiers?.filter(specifier => {
      if (
        specifier.type === 'ImportSpecifier' &&
        (specifier.imported.name === 'IVec' ||
          specifier.imported.name === 'IVec3' ||
          specifier.imported.name === 'Vec' ||
          specifier.imported.name === 'IBound' ||
          specifier.imported.name === 'Bound') &&
        path.node.source.value !== '@blocksuite/global/utils'
      ) {
        existModules.push(specifier.imported.name);
        return false;
      }

      if (path.node.source.value === '@blocksuite/global/utils') {
        globalImportPath = path;
      }

      return true;
    });

    if (existModules.length) {
      if (path.node.specifiers?.length === 0) {
        j(path).remove();
      }

      if (!globalImportPath!) {
        const newImport = j.importDeclaration(
          existModules.map(name => j.importSpecifier(j.identifier(name))),
          j.literal('@blocksuite/global/utils')
        );

        // Insert the new import statement at the beginning of the file
        root.get().node.program.body.unshift(newImport);
      } else {
        existModules.forEach(name => {
          globalImportPath.node.specifiers.push(
            j.importSpecifier(j.identifier(name))
          );
        });
      }
    }
  });

  return root.toSource();
}
