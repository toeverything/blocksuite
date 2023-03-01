import '@shoelace-style/shoelace';

import { TextAttributes, VEditor } from '@blocksuite/virgo';
import { css, html, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import * as Y from 'yjs';

function toggleStyle(
  vEditor: VEditor,
  attrs: NonNullable<TextAttributes>
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
  let oldAttributes: NonNullable<TextAttributes> = {};

  for (const [delta] of deltas) {
    const attributes = delta.attributes;

    if (!attributes) {
      continue;
    }

    oldAttributes = { ...attributes };
  }

  const newAttributes = Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => {
      if (
        typeof v === 'boolean' &&
        v === (oldAttributes as { [k: string]: unknown })[k]
      ) {
        return [k, !v];
      } else {
        return [k, v];
      }
    })
  );

  vEditor.formatText(vRange, newAttributes, {
    mode: 'merge',
  });
  root.blur();

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
    const strikeButton = this.shadowRoot.querySelector('.strike');
    const code = this.shadowRoot.querySelector('.code');
    const resetButton = this.shadowRoot.querySelector('.reset');
    const undoButton = this.shadowRoot.querySelector('.undo');
    const redoButton = this.shadowRoot.querySelector('.redo');

    if (
      !boldButton ||
      !italicButton ||
      !underlineButton ||
      !strikeButton ||
      !code ||
      !resetButton ||
      !undoButton ||
      !redoButton
    ) {
      throw new Error('Cannot find button');
    }

    const undoManager = new Y.UndoManager(this.vEditor.yText, {
      trackedOrigins: new Set([this.vEditor.yText.doc?.clientID]),
    });

    addEventListener('keydown', e => {
      if (
        e instanceof KeyboardEvent &&
        (e.ctrlKey || e.metaKey) &&
        e.key === 'z'
      ) {
        e.preventDefault();
        if (e.shiftKey) {
          undoManager.redo();
        } else {
          undoManager.undo();
        }
      }
    });

    undoButton.addEventListener('click', () => {
      undoManager.undo();
    });
    redoButton.addEventListener('click', () => {
      undoManager.redo();
    });

    boldButton.addEventListener('click', () => {
      undoManager.stopCapturing();
      toggleStyle(this.vEditor, { bold: true });
    });
    italicButton.addEventListener('click', () => {
      undoManager.stopCapturing();
      toggleStyle(this.vEditor, { italic: true });
    });
    underlineButton.addEventListener('click', () => {
      undoManager.stopCapturing();
      toggleStyle(this.vEditor, { underline: true });
    });
    strikeButton.addEventListener('click', () => {
      undoManager.stopCapturing();
      toggleStyle(this.vEditor, { strike: true });
    });
    code.addEventListener('click', () => {
      undoManager.stopCapturing();
      toggleStyle(this.vEditor, { code: true });
    });
    resetButton.addEventListener('click', () => {
      undoManager.stopCapturing();
      const rangeStatic = this.vEditor.getVRange();
      if (!rangeStatic) {
        return;
      }
      this.vEditor.resetText(rangeStatic);
    });
  }

  protected render(): unknown {
    return html`
      <div class="tool-bar">
        <sl-button class="bold">bold</sl-button>
        <sl-button class="italic">italic</sl-button>
        <sl-button class="underline">underline</sl-button>
        <sl-button class="strike">strike</sl-button>
        <sl-button class="code">code</sl-button>
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
      width: 400px;
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
