import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getBlockElementById } from '../../../../_legacy/index.js';
import type { RichText } from '../../../../components/rich-text/rich-text.js';
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
    const block = getBlockElementById(
      this.frameModel.id,
      this.edgeless
    ) as FrameBlockComponent | null;
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
    this.frameBlock.titleHide = true;

    this.disposables.add(
      dispatcher.add('doubleClick', () => {
        return true;
      })
    );
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

    this.updateComplete.then(() => {
      this.vEditor.selectAll();
      this.disposables.addFromEvent(this.vEditorContainer, 'blur', () => {
        this._unmount();
      });
    });
  }

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.frameBlock.titleHide = false;
    this.edgeless.selectionManager.setSelection({
      elements: [],
      editing: false,
    });
    this.remove();
  }

  override render() {
    const viewport = this.edgeless.surface.viewport;
    const bound = Bound.deserialize(this.frameModel.xywh);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const virgoStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '35px',
      width: 'fit-content',
      padding: '4px 10px',
      fontSize: '14px',
      position: 'absolute',

      left: x + 'px',
      top: y - 38 + 'px',
      minWidth: '8px',
      fontFamily: 'sans-serif',
      color: 'white',
      background: this.frameBlock.color,
      outline: 'none',
      zIndex: '1',
    });
    return html`<rich-text
      .yText=${this.frameModel.title.yText}
      .enableFormat=${false}
      style=${virgoStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-title-editor': EdgelessFrameTitleEditor;
  }
}
