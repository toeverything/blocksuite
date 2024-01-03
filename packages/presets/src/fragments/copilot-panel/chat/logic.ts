import type { AffineEditorContainer } from '../../../editors/index.js';
import { getChatService } from '../doc/api.js';
import {
  getSelectedTextContent,
  selectedToCanvas,
} from '../utils/selection-utils.js';

export class AIChatLogic {
  constructor(private editor: AffineEditorContainer) {}

  get host() {
    return this.editor.host;
  }

  reactiveData!: {
    history: Message[];
    loading: boolean;
  };

  async genAnswer() {
    this.reactiveData.loading = true;
    const result = await getChatService().chat(this.reactiveData.history);
    this.reactiveData.loading = false;
    this.reactiveData.history.push({
      role: 'assistant',
      content: result,
    });
  }

  selectTextForBackground = async () => {
    const text = await getSelectedTextContent(this.editor.host);
    if (!text) return;
    this.reactiveData.history.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text,
        },
      ],
    });
  };

  selectShapesForBackground = async () => {
    const canvas = await selectedToCanvas(this.editor);
    if (!canvas) {
      alert('Please select some shapes first');
      return;
    }
    const url = canvas.toDataURL();
    this.reactiveData.history.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url,
          },
        },
      ],
    });
  };
}

type MessageContent =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    };

type Message =
  | {
      role: 'user';
      content: MessageContent[];
    }
  | {
      role: 'assistant';
      content: string;
    };
