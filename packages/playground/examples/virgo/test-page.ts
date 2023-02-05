import * as Y from 'yjs';
import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import {
  BaseArrtiubtes,
  BaseText,
  DeltaInsert,
  InlineCode,
  InlineCodeAttributes,
  TextAttributes,
  TextElement,
  VEditor,
} from '@blocksuite/virgo';
import '@shoelace-style/shoelace';

export function renderElement(delta: DeltaInsert<TextAttributes>): TextElement {
  switch (delta.attributes.type) {
    case 'base': {
      const baseText = new BaseText();
      baseText.delta = delta as DeltaInsert<BaseArrtiubtes>;
      return baseText;
    }
    case 'inline-code': {
      const inlineCode = new InlineCode();
      inlineCode.delta = delta as DeltaInsert<InlineCodeAttributes>;
      return inlineCode;
    }

    default:
      throw new Error(`Unknown text type: ${delta.attributes.type}`);
  }
}

const baseStyle: Array<Exclude<keyof BaseArrtiubtes, 'type'>> = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
];
function toggleStyle(
  vEditor: VEditor,
  type: Exclude<keyof BaseArrtiubtes, 'type'> | 'inline-code'
): void {
  const vRange = vEditor.getVRange();
  if (!vRange) {
    return;
  }

  const root = vEditor.getRootElement();
  if (!root) {
    return;
  }

  const deltas = vEditor.getDeltasByVRange(vRange);

  if (baseStyle.includes(type as Exclude<keyof BaseArrtiubtes, 'type'>)) {
    vEditor.formatText(
      vRange,
      {
        type: 'base',
        [type]: deltas.every(
          ([d]) =>
            d.attributes.type === 'base' &&
            d.attributes[type as Exclude<keyof BaseArrtiubtes, 'type'>]
        )
          ? null
          : true,
      },
      {
        mode: 'merge',
      }
    );
    root.blur();
  } else if (type === 'inline-code') {
    vEditor.formatText(
      vRange,
      {
        type: deltas.every(([d]) => d.attributes.type === 'inline-code')
          ? 'base'
          : 'inline-code',
      },
      {
        mode: 'merge',
      }
    );
    root.blur();
  }

  vEditor.syncVRange();
}

@customElement('rich-text')
export class RichText extends LitElement {
  vEditor: VEditor;

  @query('.rich-text-container')
  private _container!: HTMLDivElement;

  constructor(vEditor: VEditor) {
    super();
    this.vEditor = vEditor;
  }

  firstUpdated() {
    this.vEditor.mount(this._container);
  }

  render() {
    return html`<style>
        .rich-text-container {
          width: 100%;
          height: 100%;
          outline: none;
        }

        code {
          font-family: 'SFMono-Regular', Menlo, Consolas, 'PT Mono',
            'Liberation Mono', Courier, monospace;
          line-height: normal;
          background: rgba(135, 131, 120, 0.15);
          color: #eb5757;
          border-radius: 3px;
          font-size: 85%;
          padding: 0.2em 0.4em;
        }
      </style>
      <div class="rich-text-container"></div>`;
  }
}

@customElement('tool-bar')
export class ToolBar extends LitElement {
  static styles = css`
    .tool-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 1fr);
    }
  `;

  vEditor: VEditor;

  constructor(vEditor: VEditor) {
    super();
    this.vEditor = vEditor;
  }

  protected firstUpdated(): void {
    if (!this.shadowRoot) {
      throw new Error('Cannot find shadow root');
    }

    const boldButton = this.shadowRoot.querySelector('.bold');
    const italicButton = this.shadowRoot.querySelector('.italic');
    const underlineButton = this.shadowRoot.querySelector('.underline');
    const strikethroughButton = this.shadowRoot.querySelector('.strikethrough');
    const inlineCode = this.shadowRoot.querySelector('.inline-code');
    const resetButton = this.shadowRoot.querySelector('.reset');
    const undoButton = this.shadowRoot.querySelector('.undo');
    const redoButton = this.shadowRoot.querySelector('.redo');

    if (
      !boldButton ||
      !italicButton ||
      !underlineButton ||
      !strikethroughButton ||
      !inlineCode ||
      !resetButton ||
      !undoButton ||
      !redoButton
    ) {
      throw new Error('Cannot find button');
    }

    boldButton.addEventListener('click', () => {
      toggleStyle(this.vEditor, 'bold');
    });
    italicButton.addEventListener('click', () => {
      toggleStyle(this.vEditor, 'italic');
    });
    underlineButton.addEventListener('click', () => {
      toggleStyle(this.vEditor, 'underline');
    });
    strikethroughButton.addEventListener('click', () => {
      toggleStyle(this.vEditor, 'strikethrough');
    });
    inlineCode.addEventListener('click', () => {
      toggleStyle(this.vEditor, 'inline-code');
    });
    resetButton.addEventListener('click', () => {
      const rangeStatic = this.vEditor.getVRange();
      if (!rangeStatic) {
        return;
      }
      this.vEditor.resetText(rangeStatic);
    });

    const undoManager = new Y.UndoManager(this.vEditor.yText, {
      trackedOrigins: new Set([this.vEditor.yText.doc?.clientID]),
    });
    undoButton.addEventListener('click', () => {
      undoManager.undo();
    });
    redoButton.addEventListener('click', () => {
      undoManager.redo();
    });
  }

  protected render(): unknown {
    return html`
      <div class="tool-bar">
        <sl-button class="bold">bold</sl-button>
        <sl-button class="italic">italic</sl-button>
        <sl-button class="underline">underline</sl-button>
        <sl-button class="strikethrough">strikethrough</sl-button>
        <sl-button class="inline-code">inline-code</sl-button>
        <sl-button class="reset">reset</sl-button>
        <sl-button class="undo">undo</sl-button>
        <sl-button class="redo">redo</sl-button>
      </div>
    `;
  }
}

@customElement('test-page')
export class TestPage extends LitElement {
  static styles = css`
    .container {
      display: grid;
      height: 100vh;
      width: 100vw;
      justify-content: center;
      align-items: center;
    }

    .editors {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 20px;
      background-color: #202124;
      border-radius: 10px;
      color: #fff;
      grid-gap: 20px;
    }

    .editors > div {
      height: 600px;
      display: grid;
      grid-template-rows: 100px 1fr;
      overflow-y: scroll;
    }
  `;

  protected firstUpdated(): void {
    const TEXT_ID = 'virgo';
    const yDocA = new Y.Doc();
    const yDocB = new Y.Doc();

    yDocA.on('update', update => {
      Y.applyUpdate(yDocB, update);
    });

    yDocB.on('update', update => {
      Y.applyUpdate(yDocA, update);
    });

    const textA = yDocA.getText(TEXT_ID);
    const editorA = new VEditor(textA, { renderElement });

    const textB = yDocB.getText(TEXT_ID);
    const editorB = new VEditor(textB, { renderElement });

    const toolBarA = new ToolBar(editorA);
    const toolBarB = new ToolBar(editorB);

    if (!this.shadowRoot) {
      throw new Error('Cannot find shadow root');
    }

    const docA = this.shadowRoot.querySelector('.doc-a');
    const docB = this.shadowRoot.querySelector('.doc-b');

    if (!docA || !docB) {
      throw new Error('Cannot find doc');
    }

    docA.appendChild(toolBarA);
    docB.appendChild(toolBarB);

    const richTextA = new RichText(editorA);
    const richTextB = new RichText(editorB);
    docA.appendChild(richTextA);
    docB.appendChild(richTextB);
  }

  protected render(): unknown {
    return html`
      <div class="container">
        <div class="editors">
          <div class="doc-a"></div>
          <div class="doc-b"></div>
        </div>
      </div>
    `;
  }
}
