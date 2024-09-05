import type { API, ASTPath, FileInfo, ImportDeclaration } from 'jscodeshift';

/**
 */
export default function (fileInfo: FileInfo, api: API) {
  const j = api.j;
  const root = j(fileInfo.source);

  let importPath!: ASTPath<ImportDeclaration>;
  let stdImportPath!: ASTPath<ImportDeclaration>;

  root.find(j.ImportDeclaration).forEach(path => {
    path.node.specifiers = path.node.specifiers?.filter(specifier => {
      if (
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.name === 'SignalWatcher'
      ) {
        importPath = path;
        return false;
      }

      return true;
    });

    if (path.node.source.value === '@blocksuite/block-std') {
      stdImportPath = path;
    }
  });

  if (importPath) {
    if (importPath.node.specifiers?.length === 0) {
      j(importPath).remove();
    }

    if (stdImportPath) {
      stdImportPath.node.specifiers?.push(
        j.importSpecifier(j.identifier('SignalWatcher'))
      );
    } else {
      const newImport = j.importDeclaration(
        [j.importSpecifier(j.identifier('SignalWatcher'))],
        j.literal('@blocksuite/block-std')
      );

      // Insert the new import statement at the beginning of the file
      root.get().node.program.body.unshift(newImport);
    }
  }

  return root.toSource();
}
