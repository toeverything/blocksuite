import Parser, { init } from 'web-tree-sitter';

export class QueryLangParser {
  private parser: Parser;
  constructor(public language: Parser.Language) {
    this.parser = new Parser();
    this.parser.setLanguage(this.language);
  }

  parse(
    input: string | Parser.Input,
    oldTree?: Parser.Tree,
    options?: Parser.Options
  ) {
    return this.parser.parse(input ?? '', oldTree, options);
  }
  static async init(): Promise<QueryLangParser> {
    await init({
      locateFile(scriptName: string) {
        return `/${scriptName}`;
      },
    });
    return new QueryLangParser(await Parser.Language.load('/query-lang.wasm'));
  }
}

let queryLangParser: Promise<QueryLangParser> | undefined;
export const getQueryLangParser = async () => {
  if (!queryLangParser) {
    queryLangParser = QueryLangParser.init();
  }
  return queryLangParser;
};
