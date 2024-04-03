import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { AffineSchemas } from '@blocksuite/blocks/schemas';
import { DocCollection, Schema } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';

import { AffineEditorContainer } from '../../editors/index.js';
import { PPTBuilder } from './utils.js';

const testData =
  "- Cover Page\n  - Laugh\n    - humor, joy, happiness, laughter\n    - An exploration into the world of laughter, its benefits, and how it impacts our lives.\n\n- Page 1\n  - The Science of Laughter\n    - laughter, science, psychology, health\n    - Laughter is not just a simple response to humor. It's a scientific phenomenon with significant impacts on our health and well-being.\n\n- Page 2\n  - The Benefits of Laughter\n    - laughter, health benefits, stress relief, immune system\n    - Laughter has numerous health benefits. It can boost your immune system, relieve stress, and even burn calories.\n\n  - Laughter Therapy\n    - laughter therapy, healing, mental health, stress management\n    - Laughter therapy is a form of therapy that encourages people to use the natural, physiological process of laughing to relieve physical or emotional stresses or discomfort.\n\n- Page 3\n  - Laughter in Culture\n    - laughter, culture, society, humor\n    - Laughter plays a significant role in every culture. It's a universal language that everyone understands.\n\n  - The Power of a Smile\n    - smile, positivity, communication, connection\n    - A smile can change the world. It's a simple act that can spread positivity and make connections.\n\n  - The Role of Comedy\n    - comedy, humor, entertainment, laughter\n    - Comedy plays a crucial role in bringing laughter and joy to our lives. It's a form of entertainment that can lighten our mood and make us feel better.\n\n- Page 4\n  - Laughter in Literature\n    - laughter, literature, books, humor\n    - Laughter has been a common theme in literature. Many authors use humor to engage readers and convey messages.\n\n  - The Art of Stand-up Comedy\n    - stand-up comedy, humor, entertainment, laughter\n    - Stand-up comedy is an art form that relies heavily on humor to entertain audiences. It's a platform where comedians share their unique perspectives on everyday life in a humorous way.\n\n  - Laughter in Movies\n    - laughter, movies, humor, entertainment\n    - Movies have always used laughter as a tool to entertain audiences. From slapstick comedy to sophisticated humor, laughter remains a key element in the film industry.\n\n  - The Impact of Laughter on Relationships\n    - laughter, relationships, connection, communication\n    - Laughter can have a profound impact on our relationships. It can break the ice, diffuse tension, and create a sense of connection.\n\n- Page 5\n  - The Future of Laughter\n    - laughter, future, technology, virtual reality\n    - As technology advances, the way we experience laughter and humor is changing. From virtual reality comedy shows to AI-generated jokes, the future of laughter is exciting and unpredictable.";

@customElement('ai-slides-renderer')
export class AISlidesRenderer extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  text = testData;

  private _editorContainer: Ref<HTMLDivElement> = createRef<HTMLDivElement>();
  private _editor!: AffineEditorContainer;

  override connectedCallback(): void {
    super.connectedCallback();

    const schema = new Schema().register(AffineSchemas);
    const collection = new DocCollection({ schema });
    const doc = collection.createDoc();

    doc.load(() => {
      const pageBlockId = doc.addBlock('affine:page', {});
      doc.addBlock('affine:surface', {}, pageBlockId);
    });

    const editor = new AffineEditorContainer();
    editor.mode = 'edgeless';
    editor.doc = doc;
    this._editor = editor;

    this._disposables.add(() => editor.remove());
  }

  protected override firstUpdated() {
    const editor = this._editor;
    this._editorContainer.value?.append(editor);

    requestAnimationFrame(() => {
      PPTBuilder(editor.host).process(this.text).catch(console.error);
    });
  }

  protected override render() {
    return html`<style>
        .slides-container {
          position: relative;
        }

        .edgeless-container {
          width: 100%;
          height: 174px;
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
          pointer-events: none;
        }

        .edgeless-container affine-edgeless-zoom-toolbar-widget,
        edgeless-toolbar {
          display: none;
        }
      </style>
      <div class="slides-container">
        <div class="edgeless-container" ${ref(this._editorContainer)}></div>
        <div class="mask"></div>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-slides-renderer': AISlidesRenderer;
  }
}
