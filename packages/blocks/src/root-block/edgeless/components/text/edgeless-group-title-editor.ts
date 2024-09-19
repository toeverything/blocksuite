import type { RichText } from '@blocksuite/affine-components/rich-text';
import type { GroupElementModel } from '@blocksuite/affine-model';

import {
  GROUP_TITLE_FONT_SIZE,
  GROUP_TITLE_OFFSET,
  GROUP_TITLE_PADDING,
} from '@blocksuite/affine-block-surface';
import {
  RANGE_SYNC_EXCLUDE_ATTR,
  ShadowlessElement,
} from '@blocksuite/block-std';
import { assertExists, Bound, WithDisposable } from '@blocksuite/global/utils';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

export class EdgelessGroupTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.group.showTitle = true;
    this.edgeless.service.selection.set({
      elements: [this.group.id],
      editing: false,
    });
    this.remove();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RANGE_SYNC_EXCLUDE_ATTR, 'true');
  }

  override firstUpdated(): void {
    const dispatcher = this.edgeless.dispatcher;
    assertExists(dispatcher);

    this.updateComplete
      .then(() => {
        this.inlineEditor.selectAll();

        this.group.showTitle = false;

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
    if (!this.group.externalXYWH) {
      console.error('group.externalXYWH is not set');
      return nothing;
    }
    const viewport = this.edgeless.service.viewport;
    const bound = Bound.deserialize(this.group.externalXYWH);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);

    const inlineEditorStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '2px',
      width: 'fit-content',
      maxHeight: '30px',
      height: 'fit-content',
      padding: `${GROUP_TITLE_PADDING[1]}px ${GROUP_TITLE_PADDING[0]}px`,
      fontSize: GROUP_TITLE_FONT_SIZE + 'px',
      position: 'absolute',
      left: x + 'px',
      top: `${y - GROUP_TITLE_OFFSET + 2}px`,
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
      style=${inlineEditorStyle}
    ></rich-text>`;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor group!: GroupElementModel;

  @query('rich-text')
  accessor richText!: RichText;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-group-title-editor': EdgelessGroupTitleEditor;
  }
}
