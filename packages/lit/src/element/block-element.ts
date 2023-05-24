import type { BaseBlockModel } from '@blocksuite/store';
import type { Page } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import { WithDisposable } from '../width-disposable.js';
import type { BlockSuiteRoot } from './lit-root.js';
import { ShadowlessElement } from './shadowless-element.js';

export class BlockElement<Model extends BaseBlockModel> extends WithDisposable(
  ShadowlessElement
) {
  @property()
  root!: BlockSuiteRoot;

  @property()
  model!: Model;

  @property()
  content!: TemplateResult;

  @property()
  page!: Page;
}
