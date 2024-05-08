import {
  RangeManager,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import type {
  FrameBlockComponent,
  FrameBlockModel,
} from '../../../../frame-block/index.js';
import { Bound } from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

@customElement('edgeless-frame-title-editor')
export class EdgelessFrameTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  frameModel!: FrameBlockModel;
  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  get editorHost() {
    return this.edgeless.host;
  }

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }
  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  get frameBlock() {
    assertExists(this.frameModel.page.root);
    const block = this.editorHost.view.viewFromPath('block', [
      this.frameModel.page.root.id,
      this.frameModel.id,
    ]) as FrameBlockComponent | null;
    assertExists(block);
    return block;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override firstUpdated(): void {
    const dispatcher = this.edgeless.dispatcher;
    assertExists(dispatcher);
    this.updateComplete
      .then(() => {
        this.inlineEditor.selectAll();

        this.inlineEditor.slots.renderComplete.on(() => {
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
          this.edgeless.service.viewport.viewportUpdated.on(() => {
            this.requestUpdate();
          })
        );

        this.disposables.add(dispatcher.add('click', () => true));
        this.disposables.add(dispatcher.add('doubleClick', () => true));
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          () => {
            this._unmount();
          }
        );
      })
      .catch(console.error);
  }

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.edgeless.service.selection.set({
      elements: [],
      editing: false,
    });
    this.remove();
  }

  override render() {
    const viewport = this.edgeless.service.viewport;
    const bound = Bound.deserialize(this.frameModel.xywh);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const isInner = this.edgeless.service.frame.getFrameInner(this.frameModel);

    const inlineEditorStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '4px',
      width: 'fit-content',
      maxHeight: '30px',
      lineHeight: '20px',
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
      style=${inlineEditorStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-title-editor': EdgelessFrameTitleEditor;
  }
}
