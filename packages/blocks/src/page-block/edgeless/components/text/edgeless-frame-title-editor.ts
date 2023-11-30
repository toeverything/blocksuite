import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { getBlockElementByPath } from '../../../../_common/utils/index.js';
import type {
  FrameBlockComponent,
  FrameBlockModel,
} from '../../../../frame-block/index.js';
import { Bound } from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-frame-title-editor')
export class EdgelessFrameTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  frameModel!: FrameBlockModel;
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  get vEditor() {
    assertExists(this.richText.vEditor);
    return this.richText.vEditor;
  }
  get vEditorContainer() {
    return this.vEditor.rootElement;
  }

  get frameBlock() {
    assertExists(this.frameModel.page.root);
    const block = getBlockElementByPath([
      this.frameModel.page.root.id,
      this.frameModel.id,
    ]) as FrameBlockComponent | null;
    assertExists(block);
    return block;
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override firstUpdated(): void {
    const dispatcher = this.edgeless.dispatcher;
    assertExists(dispatcher);
    this.frameBlock.showTitle = false;

    this.updateComplete.then(() => {
      this.vEditor.selectAll();

      this.vEditor.slots.updated.on(() => {
        this.requestUpdate();
      });

      this.disposables.add(
        dispatcher.add('keyDown', ctx => {
          const state = ctx.get('keyboardState');
          if (state.raw.key === 'Enter' && !state.raw.isComposing) {
            this._unmount();
            return true;
          }
          requestAnimationFrame(() => {
            this.requestUpdate();
          });
          return false;
        })
      );
      this.disposables.add(
        this.edgeless.slots.viewportUpdated.on(() => {
          this.requestUpdate();
        })
      );

      this.disposables.add(dispatcher.add('click', () => true));
      this.disposables.add(dispatcher.add('doubleClick', () => true));
      this.disposables.addFromEvent(this.vEditorContainer, 'blur', () => {
        this._unmount();
      });
    });
  }

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.frameBlock.showTitle = true;
    this.edgeless.selectionManager.setSelection({
      elements: [],
      editing: false,
    });
    this.remove();
  }

  override render() {
    const viewport = this.edgeless.surface.viewport;
    const frameBlock = this.frameBlock;
    const bound = Bound.deserialize(this.frameModel.xywh);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const { isInner } = frameBlock;

    const virgoStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '4px',
      width: 'fit-content',
      padding: '4px 10px',
      fontSize: '14px',
      position: 'absolute',
      left: (isInner ? x + 8 : x) + 'px',
      top: (isInner ? y + 8 : y - 38) + 'px',
      minWidth: '8px',
      fontFamily: 'var(--affine-font-family)',
      background: isInner
        ? 'var(--affine-white)'
        : 'var(--affine-text-primary-color)',
      color: isInner
        ? 'var(--affine-text-secondary-color)'
        : 'var(--affine-white)',
      outline: 'none',
      zIndex: '1',
      border: `1px solid
        var(--affine-primary-color)`,
      boxShadow: `0px 0px 0px 2px rgba(30, 150, 235, 0.3)`,
    });
    return html`<rich-text
      .yText=${this.frameModel.title.yText}
      .enableFormat=${false}
      .enableAutoScrollHorizontally=${false}
      .enableAutoScrollVertically=${false}
      style=${virgoStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-title-editor': EdgelessFrameTitleEditor;
  }
}
