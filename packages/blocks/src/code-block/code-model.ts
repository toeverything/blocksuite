import { BaseBlockModel, defineBlockSchema, Page } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export const CodeBlockSchema = defineBlockSchema(
  {
    language: 'JavaScript',
  },
  (get, set) => ({
    setLang: (language: string) => {
      set({
        language,
      });
    },
  }),
  {
    version: 1,
    flavour: 'affine:code',
    tag: literal`affine-code`,
  }
);

export class CodeBlockModel
  extends BaseBlockModel<BlockSuiteModelProps.CodeBlockModel>
  implements BlockSuiteModelProps.CodeBlockModel
{
  static version = 1;
  flavour = 'affine:code' as const;
  tag = literal`affine-code`;

  language: string;

  setLang(lang: string) {
    this.page.updateBlockById(this.id, {
      language: lang,
    });
  }

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteModelProps.CodeBlockModel>>
  ) {
    super(page, props);
    throw new Error('unreachable');
  }
}
