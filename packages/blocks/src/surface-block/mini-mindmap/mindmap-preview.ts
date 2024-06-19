import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';
import { type Doc, Job } from '@blocksuite/store';
import {
  DocCollection,
  type DocCollectionOptions,
  Generator,
  Schema,
} from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { MarkdownAdapter } from '../../_common/adapters/markdown.js';
import {
  MindmapStyleFour,
  MindmapStyleOne,
  MindmapStyleThree,
  MindmapStyleTwo,
} from '../../_common/icons/edgeless.js';
import type { MindmapElementModel } from '../element-model/mindmap.js';
import { MindmapStyle } from '../element-model/utils/mindmap/style.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import { MindmapRootBlock } from './mindmap-root-block.js';
import { MiniMindmapSchema, MiniMindmapSpecs } from './spec.js';
import { MindmapSurfaceBlock } from './surface-block.js';

noop(MindmapRootBlock);
noop(MindmapSurfaceBlock);

const mindmapStyles = [
  [MindmapStyle.ONE, MindmapStyleOne],
  [MindmapStyle.TWO, MindmapStyleTwo],
  [MindmapStyle.THREE, MindmapStyleThree],
  [MindmapStyle.FOUR, MindmapStyleFour],
];

type Unpacked<T> = T extends (infer U)[] ? U : T;

@customElement('mini-mindmap-preview')
export class MiniMindmapPreview extends WithDisposable(LitElement) {
  static override styles = css`
    mini-mindmap-root-block,
    mini-mindmap-surface-block,
    editor-host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .select-template-title {
      align-self: stretch;

      color: var(
        --light-textColor-textSecondaryColor,
        var(--textColor-textSecondaryColor, #8e8d91)
      );

      font-family: Inter;
      font-size: 12px;
      font-style: normal;
      font-weight: 500;
      line-height: 20px;

      margin-bottom: 4px;
    }

    .template {
      display: flex;
      gap: 12px;
    }

    .template-item {
      box-sizing: border-box;
      border: 2px solid var(--affine-border-color);
      border-radius: 4px;
      padding: 4px 6px;
    }

    .template-item.active,
    .template-item:hover {
      border-color: var(--affine-brand-color);
    }

    .template-item > svg {
      display: block;
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor answer!: string;

  @property({ attribute: false })
  accessor templateShow = true;

  @property({ attribute: false })
  accessor height = 400;

  @property({ attribute: false })
  accessor ctx!: {
    get(): Record<string, unknown>;
    set(data: Record<string, unknown>): void;
  };

  @property({ attribute: false })
  accessor mindmapStyle: MindmapStyle | undefined = undefined;

  @query('editor-host')
  accessor portalHost!: EditorHost;

  doc!: Doc;

  surface!: SurfaceBlockModel;

  mindmapId!: string;

  get _mindmap() {
    return this.surface.getElementById(this.mindmapId) as MindmapElementModel;
  }

  private _createTemporaryDoc() {
    const schema = new Schema();
    schema.register(MiniMindmapSchema);
    const options: DocCollectionOptions = {
      id: 'MINI_MINDMAP_TEMPORARY',
      schema,
      idGenerator: Generator.NanoID,
      awarenessSources: [],
    };

    const collection = new DocCollection(options);
    collection.meta.initialize();
    collection.start();

    const doc = collection.createDoc({ id: 'doc:home' }).load();
    const rootId = doc.addBlock('affine:page', {});
    const surfaceId = doc.addBlock('affine:surface', {}, rootId);
    const surface = doc.getBlockById(surfaceId) as SurfaceBlockModel;
    doc.resetHistory();

    return {
      doc,
      surface,
    };
  }

  private _toMindmapNode(answer: string, doc: Doc) {
    return markdownToMindmap(answer, doc);
  }

  private _switchStyle(style: MindmapStyle) {
    if (!this._mindmap) {
      return;
    }

    this.doc.transact(() => {
      this._mindmap.style = style;
    });

    this.ctx.set({
      ...this.ctx.get(),
      style,
    });
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const tempDoc = this._createTemporaryDoc();
    const mindmapNode = this._toMindmapNode(this.answer, tempDoc.doc);

    if (!mindmapNode) {
      return;
    }

    this.doc = tempDoc.doc;
    this.surface = tempDoc.surface;
    this.mindmapId = this.surface.addElement({
      type: 'mindmap',
      children: mindmapNode,
      style: this.mindmapStyle ?? MindmapStyle.FOUR,
    });

    const centerPosition = this._mindmap.tree.element.xywh;

    this.ctx.set({
      node: mindmapNode,
      style: MindmapStyle.FOUR,
      centerPosition,
    });
  }

  override render() {
    const curStyle = this._mindmap.style;

    return html` <div>
      <div
        style=${styleMap({
          height: this.height + 'px',
          border: '1px solid var(--affine-border-color)',
          borderRadius: '4px',
        })}
      >
        ${this.host.renderSpecPortal(this.doc, MiniMindmapSpecs)}
      </div>

      ${this.templateShow
        ? html` <div class="select-template-title">Select template</div>
            <div class="template">
              ${repeat(
                mindmapStyles,
                ([style]) => style,
                ([style, icon]) => {
                  return html`<div
                    class=${`template-item ${curStyle === style ? 'active' : ''}`}
                    @click=${() => this._switchStyle(style as MindmapStyle)}
                  >
                    ${icon}
                  </div>`;
                }
              )}
            </div>`
        : nothing}
    </div>`;
  }
}

type Node = {
  text: string;
  children: Node[];
};

export const markdownToMindmap = (answer: string, doc: Doc) => {
  let result: Node | null = null;
  const job = new Job({ collection: doc.collection });
  const markdown = new MarkdownAdapter(job);
  const ast = markdown['_markdownToAst'](answer);
  const traverse = (
    markdownNode: Unpacked<(typeof ast)['children']>,
    firstLevel = false
  ): Node | null => {
    switch (markdownNode.type) {
      case 'list':
        {
          const listItems = markdownNode.children
            .map(child => traverse(child))
            .filter(val => val);

          if (firstLevel) {
            return listItems[0];
          }
        }
        break;
      case 'listItem': {
        const paragraph = markdownNode.children[0];
        const list = markdownNode.children[1];
        const node: Node = {
          text: '',
          children: [],
        };

        if (paragraph?.type === 'paragraph') {
          if (paragraph.children[0]?.type === 'text') {
            node.text = paragraph.children[0].value;
          }
        }

        if (list?.type === 'list') {
          node.children = list.children
            .map(child => traverse(child))
            .filter(val => val) as Node[];
        }

        return node;
      }
    }

    return null;
  };

  if (ast?.children?.[0]?.type === 'list') {
    result = traverse(ast.children[0], true);
  }

  return result;
};
