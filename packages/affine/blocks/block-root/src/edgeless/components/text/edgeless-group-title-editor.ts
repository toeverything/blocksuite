import {
  GROUP_TITLE_FONT_SIZE,
  GROUP_TITLE_OFFSET,
  GROUP_TITLE_PADDING,
} from '@blocksuite/affine-block-surface';
import type { GroupElementModel } from '@blocksuite/affine-model';
import type { RichText } from '@blocksuite/affine-rich-text';
import { type BlockComponent, ShadowlessElement } from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { RANGE_SYNC_EXCLUDE_ATTR } from '@blocksuite/block-std/inline';
import { Bound } from '@blocksuite/global/gfx';
import { WithDisposable } from '@blocksuite/global/lit';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

export class EdgelessGroupTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  get inlineEditor() {
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor?.rootElement;
  }

  get gfx() {
    return this.edgeless.std.get(GfxControllerIdentifier);
  }

  get selection() {
    return this.gfx.selection;
  }

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.group.showTitle = true;
    this.selection.set({
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
    const dispatcher = this.edgeless.std.event;

    this.updateComplete
      .then(() => {
        if (!this.inlineEditor) return;
        this.inlineEditor.selectAll();

        this.group.showTitle = false;

        this.inlineEditor.slots.renderComplete.subscribe(() => {
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
          this.gfx.viewport.viewportUpdated.subscribe(() => {
            this.requestUpdate();
          })
        );

        this.disposables.add(dispatcher.add('click', () => true));
        this.disposables.add(dispatcher.add('doubleClick', () => true));

        if (!this.inlineEditorContainer) return;
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
    const viewport = this.gfx.viewport;
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
  accessor edgeless!: BlockComponent;

  @property({ attribute: false })
  accessor group!: GroupElementModel;

  @query('rich-text')
  accessor richText!: RichText;
}
