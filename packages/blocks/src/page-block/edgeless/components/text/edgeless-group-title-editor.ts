import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import type { GroupElement } from '../../../../surface-block/index.js';
import { Bound } from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

@customElement('edgeless-group-title-editor')
export class EdgelessGroupTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  group!: GroupElement;
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  get vEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }
  get vEditorContainer() {
    return this.vEditor.rootElement;
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override firstUpdated(): void {
    const dispatcher = this.edgeless.dispatcher;
    assertExists(dispatcher);

    this.updateComplete.then(() => {
      this.vEditor.selectAll();

      this.edgeless.localRecord.update(this.group.id, { showTitle: false });

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
    this.edgeless.localRecord.update(this.group.id, {
      showTitle: true,
    });
    this.edgeless.selectionManager.setSelection({
      elements: [this.group.id],
      editing: false,
    });
    this.remove();
  }

  override render() {
    const viewport = this.edgeless.surface.viewport;
    const bound = Bound.deserialize(this.group.xywh);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const virgoStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '35px',
      width: 'fit-content',
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
      .yText=${this.group.title}
      .enableFormat=${false}
      .enableAutoScrollHorizontally=${false}
      .enableAutoScrollVertically=${false}
      style=${virgoStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-group-title-editor': EdgelessGroupTitleEditor;
  }
}
