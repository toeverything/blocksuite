import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import {
  type AffineAIPanelWidgetConfig,
  EdgelessEditorBlockSpecs,
} from '@blocksuite/blocks';
import { AffineSchemas } from '@blocksuite/blocks/schemas';
import type { Doc } from '@blocksuite/store';
import { DocCollection, Schema } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import { PPTBuilder } from '../slides/index.js';

const testData =
  "- Cover Page\n  - Laugh\n    - humor, joy, happiness, laughter\n    - An exploration into the world of laughter, its benefits, and how it impacts our lives.\n\n- Page 1\n  - The Science of Laughter\n    - laughter, science, psychology, health\n    - Laughter is not just a simple response to humor. It's a scientific phenomenon with significant impacts on our health and well-being.\n\n- Page 2\n  - The Benefits of Laughter\n    - laughter, health benefits, stress relief, immune system\n    - Laughter has numerous health benefits. It can boost your immune system, relieve stress, and even burn calories.\n\n  - Laughter Therapy\n    - laughter therapy, healing, mental health, stress management\n    - Laughter therapy is a form of therapy that encourages people to use the natural, physiological process of laughing to relieve physical or emotional stresses or discomfort.\n\n- Page 3\n  - Laughter in Culture\n    - laughter, culture, society, humor\n    - Laughter plays a significant role in every culture. It's a universal language that everyone understands.\n\n  - The Power of a Smile\n    - smile, positivity, communication, connection\n    - A smile can change the world. It's a simple act that can spread positivity and make connections.\n\n  - The Role of Comedy\n    - comedy, humor, entertainment, laughter\n    - Comedy plays a crucial role in bringing laughter and joy to our lives. It's a form of entertainment that can lighten our mood and make us feel better.\n\n- Page 4\n  - Laughter in Literature\n    - laughter, literature, books, humor\n    - Laughter has been a common theme in literature. Many authors use humor to engage readers and convey messages.\n\n  - The Art of Stand-up Comedy\n    - stand-up comedy, humor, entertainment, laughter\n    - Stand-up comedy is an art form that relies heavily on humor to entertain audiences. It's a platform where comedians share their unique perspectives on everyday life in a humorous way.\n\n  - Laughter in Movies\n    - laughter, movies, humor, entertainment\n    - Movies have always used laughter as a tool to entertain audiences. From slapstick comedy to sophisticated humor, laughter remains a key element in the film industry.\n\n  - The Impact of Laughter on Relationships\n    - laughter, relationships, connection, communication\n    - Laughter can have a profound impact on our relationships. It can break the ice, diffuse tension, and create a sense of connection.\n\n- Page 5\n  - The Future of Laughter\n    - laughter, future, technology, virtual reality\n    - As technology advances, the way we experience laughter and humor is changing. From virtual reality comedy shows to AI-generated jokes, the future of laughter is exciting and unpredictable.";

export const createSlidesRenderer: (
  host: EditorHost,
  ctx: {
    get: () => Record<string, unknown>;
    set: (data: Record<string, unknown>) => void;
  }
) => AffineAIPanelWidgetConfig['answerRenderer'] = (host, ctx) => {
  return (answer, state) => {
    if (state !== 'finished') {
      return nothing;
    }

    return html`<style>
        .slides-container {
          width: 100%;
          height: 400px;
        }
      </style>
      <div class="slides-container">
        <ai-slides-renderer
          .host=${host}
          .ctx=${ctx}
          .text=${answer}
        ></ai-slides-renderer>
      </div>`;
  };
};

@customElement('ai-slides-renderer')
export class AISlidesRenderer extends WithDisposable(LitElement) {
  static override styles = css``;

  @property({ attribute: false })
  text = testData;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  ctx?: {
    get(): Record<string, unknown>;
    set(data: Record<string, unknown>): void;
  };

  private _editorContainer: Ref<HTMLDivElement> = createRef<HTMLDivElement>();
  private _doc!: Doc;

  @query('editor-host')
  private _editorHost!: EditorHost;

  override connectedCallback(): void {
    super.connectedCallback();

    const schema = new Schema().register(AffineSchemas);
    const collection = new DocCollection({ schema, id: 'SLIDES_PREVIEW' });
    collection.start();
    const doc = collection.createDoc();

    doc.load(() => {
      const pageBlockId = doc.addBlock('affine:page', {});
      doc.addBlock('affine:surface', {}, pageBlockId);
    });

    doc.resetHistory();
    this._doc = doc;
  }

  protected override firstUpdated() {
    requestAnimationFrame(() => {
      if (!this._editorHost) return;
      PPTBuilder(this._editorHost)
        .process(this.text)
        .then(res => {
          if (this.ctx) {
            this.ctx.set({
              contents: res.contents,
              images: res.images,
            });
          }
        })
        .catch(console.error);
    });
  }

  protected override render() {
    return html`<style>
        .slides-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .edgeless-container {
          width: 100%;
          height: 100%;
          border-radius: 4px;
          border: 1px solid var(--affine-border-color);
        }

        .mask {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
          background-color: transparent;
          width: 100%;
          height: 100%;
        }

        .edgeless-container affine-edgeless-zoom-toolbar-widget,
        edgeless-toolbar {
          display: none;
        }

        * {
          box-sizing: border-box;
        }

        .affine-edgeless-viewport {
          display: block;
          height: 100%;
          position: relative;
          overflow: hidden;
          container-name: viewport;
          container-type: inline-size;
        }

        .affine-edgeless-surface-block-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .affine-edgeless-surface-block-container canvas {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 1;
          pointer-events: none;
        }

        edgeless-block-portal-container {
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
          display: block;
          height: 100%;
          font-family: var(--affine-font-family);
          font-size: var(--affine-font-base);
          line-height: var(--affine-line-height);
          color: var(--affine-text-primary-color);
          font-weight: 400;
        }

        .affine-block-children-container.edgeless {
          padding-left: 0;
          position: relative;
          overflow: hidden;
          height: 100%;
          touch-action: none;
          background-color: var(--affine-background-primary-color);
          background-image: radial-gradient(
            var(--affine-edgeless-grid-color) 1px,
            var(--affine-background-primary-color) 1px
          );
          z-index: 0;
        }

        .affine-edgeless-block-child {
          position: absolute;
          transform-origin: center;
          box-sizing: border-box;
          border: 2px solid var(--affine-white-10);
          border-radius: 8px;
          box-shadow: var(--affine-shadow-3);
          pointer-events: all;
        }

        affine-edgeless-image .resizable-img,
        affine-edgeless-image .resizable-img img {
          width: 100%;
          height: 100%;
        }

        .affine-edgeless-layer {
          position: absolute;
          top: 0;
          left: 0;
          contain: size layout style;
        }
      </style>
      <div class="slides-container">
        <div
          class="edgeless-container affine-edgeless-viewport"
          ${ref(this._editorContainer)}
        >
          ${this.host.renderSpecPortal(this._doc, EdgelessEditorBlockSpecs)}
        </div>
        <div class="mask"></div>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-slides-renderer': AISlidesRenderer;
  }
}
