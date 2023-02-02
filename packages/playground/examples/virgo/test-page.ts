import * as Y from 'yjs';
import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { BaseArrtiubtes, VEditor } from '@blocksuite/virgo';
import '@shoelace-style/shoelace';

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

  private format(vEditor: VEditor, mark: Partial<BaseArrtiubtes>): void {
    const rangeStatic = vEditor.getVRange();
    if (!rangeStatic) {
      return;
    }

    vEditor.formatText(
      rangeStatic,
      { type: 'base', ...mark },
      {
        mode: 'merge',
      }
    );
    vEditor.syncVRange();
  }

  protected firstUpdated(): void {
    if (!this.shadowRoot) {
      throw new Error('Cannot find shadow root');
    }

    const boldButton = this.shadowRoot.querySelector('.bold');
    const italicButton = this.shadowRoot.querySelector('.italic');
    const underlineButton = this.shadowRoot.querySelector('.underline');
    const strikethroughButton = this.shadowRoot.querySelector('.strikethrough');
    const resetButton = this.shadowRoot.querySelector('.reset');
    const undoButton = this.shadowRoot.querySelector('.undo');
    const redoButton = this.shadowRoot.querySelector('.redo');

    if (
      !boldButton ||
      !italicButton ||
      !underlineButton ||
      !strikethroughButton ||
      !resetButton ||
      !undoButton ||
      !redoButton
    ) {
      throw new Error('Cannot find button');
    }

    boldButton.addEventListener('click', () => {
      this.format(this.vEditor, { bold: true });
    });
    italicButton.addEventListener('click', () => {
      this.format(this.vEditor, { italic: true });
    });
    underlineButton.addEventListener('click', () => {
      this.format(this.vEditor, { underline: true });
    });
    strikethroughButton.addEventListener('click', () => {
      this.format(this.vEditor, { strikethrough: true });
    });
    resetButton.addEventListener('click', () => {
      const rangeStatic = this.vEditor.getVRange();
      if (!rangeStatic) {
        return;
      }
      this.vEditor.resetText(rangeStatic);
    });

    const undoManager = new Y.UndoManager(this.vEditor.yText);
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
    const editorA = new VEditor(textA);

    const textB = yDocB.getText(TEXT_ID);
    const editorB = new VEditor(textB);

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
