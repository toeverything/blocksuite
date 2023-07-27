import type { UIEventDispatcher } from '@blocksuite/block-std';
import type { Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { property } from 'lit/decorators.js';

import type { DataViewSelection } from '../../__internal__/index.js';
import type { BlockOperation } from '../types.js';
import type { DataViewManager } from './data-view-manager.js';

export class BaseDataView<
  T extends DataViewManager,
  Selection extends DataViewSelection
> extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  view!: T;
  @property({ attribute: false })
  blockId!: string;

  @property({ attribute: false })
  blockOperation!: BlockOperation;

  @property({ attribute: false })
  titleText!: Text;

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  uiEventDispatcher!: UIEventDispatcher;

  @property({ attribute: false })
  modalMode?: boolean;

  @property({ attribute: false })
  path!: string[];

  @property({ attribute: false })
  setSelection!: (selection?: Selection) => void;
  @property({ attribute: false })
  selectionUpdated!: Slot<Selection | undefined>;
}
