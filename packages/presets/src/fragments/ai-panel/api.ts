import {
  BlocksUtils,
  EmbedHtmlBlockModel,
  EmbedHtmlBlockSpec,
  loadImages,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Workspace } from '@blocksuite/store';

import type { EditorContainer } from '../../components/index.js';
import { GPTAPI, type GPTAPIPayloadMap } from './actions/index.js';
import { demoScript } from './demo-script.js';
import {
  editImage,
  jpegBase64ToFile,
  pngBase64ToFile,
} from './utils/edit-image.js';
import { genHtml } from './utils/gen-html.js';
import { getEdgelessPageBlockFromEditor } from './utils/mind-map-utils.js';
import {
  getSelectedTextContent,
  selectedToCanvas,
  selectedToPng,
} from './utils/selection-utils.js';

export class EditorWithAI {
  static GPTAPIKey = '';
  static FalAPIKey = '';
  workspace: Workspace;
  root: BlockSuiteRoot;

  constructor(private editor: EditorContainer) {
    this.workspace = editor.page.workspace;
    assertExists(editor.root.value, 'Editor root is not ready');
    this.root = editor.root.value;
  }

  async makeItReal() {
    const png = await selectedToPng(this.editor);
    if (!png) {
      return;
    }
    const edgelessPage = getEdgelessPageBlockFromEditor(this.editor);
    const { notes } = BlocksUtils.splitElements(
      edgelessPage.selectionManager.elements
    );
    // @ts-ignore
    const htmlBlock: {
      html: string;
      design: string;
    } = notes.flatMap(v =>
      v.children.filter(v => {
        if (v instanceof EmbedHtmlBlockModel) {
          return v.html && v.design;
        } else {
          return false;
        }
      })
    )[0];
    const html = await genHtml(png, htmlBlock);
    if (!html) {
      return;
    }
    edgelessPage.page.addBlock(
      EmbedHtmlBlockSpec.schema.model.flavour,
      { html, design: png, xywh: '[0, 400, 400, 200]' },
      edgelessPage.surface.model.id
    );
  }

  async htmlBlockDemo() {
    const edgelessPage = getEdgelessPageBlockFromEditor(this.editor);
    edgelessPage.page.addBlock(
      EmbedHtmlBlockSpec.schema.model.flavour,
      { html: demoScript, xywh: '[0, 400, 400, 200]' },
      edgelessPage.surface.model.id
    );
  }

  async showMeImage() {
    const canvas = await selectedToCanvas(this.editor);
    canvas?.toBlob(async blob => {
      if (blob) {
        const prompt =
          (
            document.getElementById(
              'ai-panel-edit-image-prompt'
            ) as HTMLInputElement
          )?.value ?? '';
        const b64 = await editImage(prompt, canvas);
        if (!b64) {
          return;
        }
        const imgFile = jpegBase64ToFile(b64, 'img');
        const edgelessPage = getEdgelessPageBlockFromEditor(this.editor);
        const imgs = await loadImages([imgFile], this.workspace.blob);
        edgelessPage.addImages(imgs);
      }
    });
  }

  async createImage() {
    const pmt = prompt('What image would you like to create?');
    if (!pmt) {
      return;
    }
    const b64 = await editImage(pmt);
    if (b64) {
      const imgFile = pngBase64ToFile(b64, 'img');
      const edgelessPage = getEdgelessPageBlockFromEditor(this.editor);
      const imgs = await loadImages([imgFile], this.workspace.blob);
      await edgelessPage.addImages(imgs);
    }
  }

  async textCompletion<K extends keyof GPTAPIPayloadMap>(
    key: K,
    payload: Omit<GPTAPIPayloadMap[K], 'input'>
  ) {
    const input = await getSelectedTextContent(this.root);
    if (!input) {
      alert('Please select some text first');
      return;
    }
    return GPTAPI[key]({ input, ...payload } as never);
  }
}
