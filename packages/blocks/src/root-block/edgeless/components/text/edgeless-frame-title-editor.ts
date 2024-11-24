import type { RichText } from '@blocksuite/affine-components/rich-text';

import { FrameBlockModel } from '@blocksuite/affine-model';
import {
  RANGE_SYNC_EXCLUDE_ATTR,
  ShadowlessElement,
} from '@blocksuite/block-std';
import { assertExists, Bound, WithDisposable } from '@blocksuite/global/utils';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

import {
  AFFINE_FRAME_TITLE_WIDGET,
  type AffineFrameTitleWidget,
} from '../../../widgets/frame-title/index.js';
import { frameTitleStyleVars } from '../../../widgets/frame-title/styles.js';

export class EdgelessFrameTitleEditor extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    .frame-title-editor {
      display: flex;
      align-items: center;
      transform-origin: top left;
      border-radius: 4px;
      width: fit-content;
      padding: 0 4px;
      outline: none;
      z-index: 1;
      border: 1px solid var(--affine-primary-color);
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      overflow: hidden;
      font-family: var(--affine-font-family);
    }
  `;

  get editorHost() {
    return this.edgeless.host;
  }

  get inlineEditor() {
    return this.richText?.inlineEditor;
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

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RANGE_SYNC_EXCLUDE_ATTR, 'true');
  }

  override firstUpdated(): void {
    const dispatcher = this.edgeless.dispatcher;
    assertExists(dispatcher);
    this.updateComplete
      .then(() => {
        if (!this.inlineEditor) return;

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
          this.inlineEditor.rootElement,
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
    const rootBlockId = this.editorHost.doc.root?.id;
    if (!rootBlockId) return nothing;

    const viewport = this.edgeless.service.viewport;
    const bound = Bound.deserialize(this.frameModel.xywh);
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const isInner = this.edgeless.service.gfx.grid.has(
      this.frameModel.elementBound,
      true,
      true,
      model => model !== this.frameModel && model instanceof FrameBlockModel
    );

    const frameTitleWidget = this.edgeless.std.view.getWidget(
      AFFINE_FRAME_TITLE_WIDGET,
      rootBlockId
    ) as AffineFrameTitleWidget | null;

    if (!frameTitleWidget) return nothing;

    const frameTitle = frameTitleWidget.getFrameTitle(this.frameModel);

    const colors = frameTitle?.colors ?? {
      background: cssVarV2('edgeless/frame/background/white'),
      text: 'var(--affine-text-primary-color)',
    };

    const inlineEditorStyle = styleMap({
      fontSize: frameTitleStyleVars.fontSize + 'px',
      position: 'absolute',
      left: (isInner ? x + 4 : x) + 'px',
      top: (isInner ? y + 4 : y - (frameTitleStyleVars.height + 8 / 2)) + 'px',
      minWidth: '8px',
      height: frameTitleStyleVars.height + 'px',
      background: colors.background,
      color: colors.text,
    });

    const richTextStyle = styleMap({
      height: 'fit-content',
    });

    return html`<div class="frame-title-editor" style=${inlineEditorStyle}>
      <rich-text
        .yText=${this.frameModel.title.yText}
        .enableFormat=${false}
        .enableAutoScrollHorizontally=${false}
        style=${richTextStyle}
      ></rich-text>
    </div>`;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor frameModel!: FrameBlockModel;

  @query('rich-text')
  accessor richText: RichText | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-frame-title-editor': EdgelessFrameTitleEditor;
  }
}
