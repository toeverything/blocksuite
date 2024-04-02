import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import {
  Bound,
  type ConnectorElementModel,
} from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

@customElement('edgeless-connector-text-editor')
export class EdgelessConnectorTextEditor extends WithDisposable(
  ShadowlessElement
) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  connector!: ConnectorElementModel;
  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }
  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
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

        this.connector.displayText = true;

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
      elements: [this.connector.id],
      editing: false,
    });
    this.remove();
  }

  override render() {
    const viewport = this.edgeless.service.viewport;
    const bound = Bound.deserialize(this.connector.xywh);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const inlineEditorStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '35px',
      width: 'fit-content',
      maxHeight: '30px',
      lineHeight: '20px',
      padding: '4px 10px',
      fontSize: '14px',
      position: 'absolute',
      left: x + 'px',
      top: y - 36 + 'px',
      minWidth: '8px',
      fontFamily: 'var(--affine-font-family)',
      color: 'var(--affine-text-primary-color)',
      background: 'var(--affine-white-10)',
      outline: 'none',
      zIndex: '1',
      border: `1px solid
        var(--affine-primary-color)`,
      boxShadow: 'var(--affine-active-shadow)',
    });
    return html`<rich-text
      .yText=${this.connector.text}
      .enableFormat=${false}
      .enableAutoScrollHorizontally=${false}
      .enableAutoScrollVertically=${false}
      style=${inlineEditorStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-text-editor': EdgelessConnectorTextEditor;
  }
}
