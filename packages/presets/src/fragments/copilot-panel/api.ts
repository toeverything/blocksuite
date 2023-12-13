import {
  BlocksUtils,
  EmbedHtmlBlockModel,
  EmbedHtmlBlockSpec,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { Workspace } from '@blocksuite/store';

import type { AffineEditorContainer } from '../../editors/index.js';
import { GPTAPI, type GPTAPIPayloadMap } from './actions/index.js';
import { demoScript } from './demo-script.js';
import {
  editImage,
  jpegBase64ToFile,
  pngBase64ToFile,
} from './utils/edit-image.js';
import { genHtml } from './utils/gen-html.js';
import { getEdgelessPageBlockFromEditor } from './utils/mind-map-utils.js';
import { askDallE3 } from './utils/request.js';
import {
  getSelectedTextContent,
  selectedToCanvas,
  selectedToPng,
} from './utils/selection-utils.js';

export class EditorWithAI {
  get workspace(): Workspace {
    return this.editor.page.workspace;
  }
  get root(): EditorHost {
    assertExists(this.editor.root);
    return this.editor.root;
  }

  constructor(private editor: AffineEditorContainer) {}

  makeItReal = async () => {
    const png = await selectedToPng(this.editor);
    if (!png) {
      alert('Please select some shapes first');
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
  };

  htmlBlockDemo = async () => {
    const edgelessPage = getEdgelessPageBlockFromEditor(this.editor);
    edgelessPage.page.addBlock(
      EmbedHtmlBlockSpec.schema.model.flavour,
      { html: demoScript, xywh: '[0, 400, 400, 200]' },
      edgelessPage.surface.model.id
    );
  };

  showMeImage = async () => {
    const canvas = await selectedToCanvas(this.editor);
    if (!canvas) {
      alert('Please select some shapes first');
      return;
    }
    canvas?.toBlob(async blob => {
      if (blob) {
        const prompt =
          (
            document.getElementById(
              'copilot-panel-edit-image-prompt'
            ) as HTMLInputElement
          )?.value ?? '';
        const b64 = await editImage(prompt, canvas);
        if (!b64) {
          return;
        }
        const imgFile = jpegBase64ToFile(b64, 'img');
        const edgelessPage = getEdgelessPageBlockFromEditor(this.editor);
        edgelessPage.addImages([imgFile]);
      }
    });
  };

  createImage = async () => {
    const edgelessPage = getEdgelessPageBlockFromEditor(this.editor);
    const prompt =
      (
        document.getElementById(
          'copilot-panel-create-image-prompt'
        ) as HTMLInputElement
      )?.value ?? '';
    if (!prompt) {
      alert('Please enter some prompt first');
      return;
    }
    const b64 = await askDallE3(prompt);
    if (b64) {
      const imgFile = pngBase64ToFile(b64, 'img');
      await edgelessPage.addImages([imgFile]);
    }
  };

  textCompletion = async <K extends keyof GPTAPIPayloadMap>(
    key: K,
    payload: Omit<GPTAPIPayloadMap[K], 'input'>
  ) => {
    const input = await getSelectedTextContent(this.root);
    if (!input) {
      alert('Please select some text first');
      return;
    }
    return GPTAPI[key]({ input, ...payload } as never);
  };
}
