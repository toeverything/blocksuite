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
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

import { Bound } from '../../../../surface-block/index.js';

@customElement('edgeless-frame-title-editor')
export class EdgelessFrameTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.edgeless.service.selection.set({
      editing: false,
      elements: [],
    });
    this.remove();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');
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

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const viewport = this.edgeless.service.viewport;
    const bound = Bound.deserialize(this.frameModel.xywh);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const isInner = this.edgeless.service.layer.framesGrid.has(
      this.frameModel.elementBound,
      true,
      true,
      new Set([this.frameModel])
    );

    const inlineEditorStyle = styleMap({
      background: isInner
        ? 'var(--affine-white)'
        : 'var(--affine-text-primary-color)',
      border: `1px solid
        var(--affine-primary-color)`,
      borderRadius: '4px',
      boxShadow: `0px 0px 0px 2px rgba(30, 150, 235, 0.3)`,
      color: isInner
        ? 'var(--affine-text-secondary-color)'
        : 'var(--affine-white)',
      fontFamily: 'var(--affine-font-family)',
      fontSize: '14px',
      left: (isInner ? x + 8 : x) + 'px',
      lineHeight: '20px',
      maxHeight: '30px',
      minWidth: '8px',
      outline: 'none',
      padding: '4px 10px',
      position: 'absolute',
      top: (isInner ? y + 8 : y - 38) + 'px',
      transformOrigin: 'top left',
      width: 'fit-content',
      zIndex: '1',
    });
    return html`<rich-text
      .yText=${this.frameModel.title.yText}
      .enableFormat=${false}
      .enableAutoScrollHorizontally=${false}
      style=${inlineEditorStyle}
    ></rich-text>`;
  }

  get editorHost() {
    return this.edgeless.host;
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

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor frameModel!: FrameBlockModel;

  @query('rich-text')
  accessor richText!: RichText;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-title-editor': EdgelessFrameTitleEditor;
  }
}
