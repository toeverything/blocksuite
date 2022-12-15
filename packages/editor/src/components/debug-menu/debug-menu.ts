import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  assertExists,
  ColorStyle,
  createEvent,
  MouseMode,
  ShapeMouseMode,
  TDShapeType,
  updateSelectedTextType,
  type GroupBlockModel,
} from '@blocksuite/blocks';
import type { Workspace } from '@blocksuite/store';
import type { EditorContainer } from '../editor-container/editor-container';
import type { BaseBlockModel } from '@blocksuite/store';

// Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc.
const icons = {
  undo: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        d="M48.5 224H40c-13.3 0-24-10.7-24-24V72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8H48.5z"
      />
    </svg>
  `,
  redo: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"
      />
    </svg>
  `,
  quote: html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      style="width: 11px;"
    >
      <path
        d="M0 216C0 149.7 53.7 96 120 96h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V320 288 216zm256 0c0-66.3 53.7-120 120-120h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H320c-35.3 0-64-28.7-64-64V320 288 216z"
      />
    </svg>
  `,
  ul: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        d="M40 48C26.7 48 16 58.7 16 72v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM16 232v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V232c0-13.3-10.7-24-24-24H40c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24H88c13.3 0 24-10.7 24-24V392c0-13.3-10.7-24-24-24H40z"
      />
    </svg>
  `,
  ol: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        d="M24 56c0-13.3 10.7-24 24-24H80c13.3 0 24 10.7 24 24V176h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H40c-13.3 0-24-10.7-24-24s10.7-24 24-24H56V80H48C34.7 80 24 69.3 24 56zM86.7 341.2c-6.5-7.4-18.3-6.9-24 1.2L51.5 357.9c-7.7 10.8-22.7 13.3-33.5 5.6s-13.3-22.7-5.6-33.5l11.1-15.6c23.7-33.2 72.3-35.6 99.2-4.9c21.3 24.4 20.8 60.9-1.1 84.7L86.8 432H120c13.3 0 24 10.7 24 24s-10.7 24-24 24H32c-9.5 0-18.2-5.6-22-14.4s-2.1-18.9 4.3-25.9l72-78c5.3-5.8 5.4-14.6 .3-20.5zM224 64H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32z"
      />
    </svg>
  `,
  checklist: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <path
        d="M211.8 339.8C200.9 350.7 183.1 350.7 172.2 339.8L108.2 275.8C97.27 264.9 97.27 247.1 108.2 236.2C119.1 225.3 136.9 225.3 147.8 236.2L192 280.4L300.2 172.2C311.1 161.3 328.9 161.3 339.8 172.2C350.7 183.1 350.7 200.9 339.8 211.8L211.8 339.8zM0 96C0 60.65 28.65 32 64 32H384C419.3 32 448 60.65 448 96V416C448 451.3 419.3 480 384 480H64C28.65 480 0 451.3 0 416V96zM48 96V416C48 424.8 55.16 432 64 432H384C392.8 432 400 424.8 400 416V96C400 87.16 392.8 80 384 80H64C55.16 80 48 87.16 48 96z"
      />
    </svg>
  `,
  switchMode: html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      style="width: 12px;"
    >
      <path
        d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96H320v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32V64H160C71.6 64 0 135.6 0 224zm512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192V352c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V448H352c88.4 0 160-71.6 160-160z"
      />
    </svg>
  `,
  mouseDefaultMode: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
      <path
        d="M0 55.2V426c0 12.2 9.9 22 22 22c6.3 0 12.4-2.7 16.6-7.5L121.2 346l58.1 116.3c7.9 15.8 27.1 22.2 42.9 14.3s22.2-27.1 14.3-42.9L179.8 320H297.9c12.2 0 22.1-9.9 22.1-22.1c0-6.3-2.7-12.3-7.4-16.5L38.6 37.9C34.3 34.1 28.9 32 23.2 32C10.4 32 0 42.4 0 55.2z"
      />
    </svg>
  `,
  mouseShapeMode: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path
        d="M315.4 15.5C309.7 5.9 299.2 0 288 0s-21.7 5.9-27.4 15.5l-96 160c-5.9 9.9-6.1 22.2-.4 32.2s16.3 16.2 27.8 16.2H384c11.5 0 22.2-6.2 27.8-16.2s5.5-22.3-.4-32.2l-96-160zM288 312V456c0 22.1 17.9 40 40 40H472c22.1 0 40-17.9 40-40V312c0-22.1-17.9-40-40-40H328c-22.1 0-40 17.9-40 40zM128 512c70.7 0 128-57.3 128-128s-57.3-128-128-128S0 313.3 0 384s57.3 128 128 128z"
      />
    </svg>
  `,
  addGroup: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path
        d="M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H328.6C339.6 12.9 360.3 0 384 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V232.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM119.4 96c-5.6 9.7-13.7 17.8-23.4 23.4V232.6c9.7 5.6 17.8 13.7 23.4 23.4H328.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4H119.4zm192 384c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V352h64v40.6c9.7 5.6 17.8 13.7 23.4 23.4H520.6c5.6-9.7 13.7-17.8 23.4-23.4V279.4c-9.7-5.6-17.8-13.7-23.4-23.4h-46c-5.4-15.4-14.6-28.9-26.5-39.6V192h72.6c11.1-19.1 31.7-32 55.4-32c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H311.4z"
      />
    </svg>
  `,
  html: html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 384 512"
      style="width: 11px;"
    >
      <path
        d="M0 32l34.9 395.8L191.5 480l157.6-52.2L384 32H0zm308.2 127.9H124.4l4.1 49.4h175.6l-13.6 148.4-97.9 27v.3h-1.1l-98.7-27.3-6-75.8h47.7L138 320l53.5 14.5 53.7-14.5 6-62.2H84.3L71.5 112.2h241.1l-4.4 47.7z"
      />
    </svg>
  `,
  markdown: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path
        d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z"
      />
    </svg>
  `,
  trash: html`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      style="width: 11px;"
    >
      <path
        d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"
      />
    </svg>
  `,
  connected: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path
        d="M54.2 202.9C123.2 136.7 216.8 96 320 96s196.8 40.7 265.8 106.9c12.8 12.2 33 11.8 45.2-.9s11.8-33-.9-45.2C549.7 79.5 440.4 32 320 32S90.3 79.5 9.8 156.7C-2.9 169-3.3 189.2 8.9 202s32.5 13.2 45.2 .9zM320 256c56.8 0 108.6 21.1 148.2 56c13.3 11.7 33.5 10.4 45.2-2.8s10.4-33.5-2.8-45.2C459.8 219.2 393 192 320 192s-139.8 27.2-190.5 72c-13.3 11.7-14.5 31.9-2.8 45.2s31.9 14.5 45.2 2.8c39.5-34.9 91.3-56 148.2-56zm64 160c0-35.3-28.7-64-64-64s-64 28.7-64 64s28.7 64 64 64s64-28.7 64-64z"
      />
    </svg>
  `,
  disconnected: html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path
        d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L440.6 320h73.8c34.2 0 93.7-28 93.7-64c0-35-59.5-64-93.7-64l-116.6 0L297.2 16.1C291.5 6.2 280.9 0 269.4 0H213.2c-10.6 0-18.3 10.2-15.4 20.4l40.3 140.9L38.8 5.1zm2.7 123.6C36 130.6 32 135.9 32 142c0 1.3 .2 2.6 .5 3.9L64 256 32.5 366.1c-.4 1.3-.5 2.6-.5 3.9c0 7.8 6.3 14 14 14H88c5 0 9.8-2.4 12.8-6.4L144 320H246.9l-49 171.6c-2.9 10.2 4.8 20.4 15.4 20.4l56.2 0c11.5 0 22.1-6.2 27.8-16.1l65.3-114.3L41.5 128.7z"
      />
    </svg>
  `,
  readonly: html` <svg
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M791.04 170.666667L853.333333 228.906667 275.626667 853.333333 213.333333 795.093333z"
      fill="#2E2F30"
    ></path>
    <path
      d="M512 981.333333C252.8 981.333333 42.666667 771.2 42.666667 512S252.8 42.666667 512 42.666667s469.333333 210.133333 469.333333 469.333333-210.133333 469.333333-469.333333 469.333333z m0-85.333333a384 384 0 1 0 0-768 384 384 0 0 0 0 768z"
      fill="#2E2F30"
    ></path>
  </svg>`,
  unReadonly: html` <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024"
  >
    <path
      d="M512 64C264.576 64 64 264.576 64 512s200.576 448 448 448 448-200.576 448-448S759.424 64 512 64zM776 400.576l-316.8 316.8c-9.728 9.728-25.472 9.728-35.2 0l-176-176c-9.728-9.728-9.728-25.472 0-35.2l35.2-35.2c9.728-9.728 25.472-9.728 35.2 0L441.6 594.176l264-264c9.728-9.728 25.472-9.728 35.2 0l35.2 35.2C785.728 375.104 785.728 390.848 776 400.576z"
    ></path>
  </svg>`,
  share: html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
    <path
      d="M352 224H305.5c-45 0-81.5 36.5-81.5 81.5c0 22.3 10.3 34.3 19.2 40.5c6.8 4.7 12.8 12 12.8 20.3c0 9.8-8 17.8-17.8 17.8h-2.5c-2.4 0-4.8-.4-7.1-1.4C210.8 374.8 128 333.4 128 240c0-79.5 64.5-144 144-144h80V34.7C352 15.5 367.5 0 386.7 0c8.6 0 16.8 3.2 23.2 8.9L548.1 133.3c7.6 6.8 11.9 16.5 11.9 26.7s-4.3 19.9-11.9 26.7l-139 125.1c-5.9 5.3-13.5 8.2-21.4 8.2H384c-17.7 0-32-14.3-32-32V224zM80 96c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16H400c8.8 0 16-7.2 16-16V384c0-17.7 14.3-32 32-32s32 14.3 32 32v48c0 44.2-35.8 80-80 80H80c-44.2 0-80-35.8-80-80V112C0 67.8 35.8 32 80 32h48c17.7 0 32 14.3 32 32s-14.3 32-32 32H80z"
    />
  </svg> `,
};

@customElement('debug-menu')
export class DebugMenu extends LitElement {
  @property()
  workspace!: Workspace;

  @property()
  editor!: EditorContainer;

  @state()
  connected = true;

  @state()
  canUndo = false;

  @state()
  canRedo = false;

  @state()
  mode: 'page' | 'edgeless' = 'page';

  @state()
  mouseModeType: MouseMode['type'] = 'default';

  @state()
  shapeModeColor: ShapeMouseMode['color'] = ColorStyle.Black;

  @state()
  shapeModeShape: ShapeMouseMode['shape'] = TDShapeType.Rectangle;

  @state()
  readonly = false;

  get mouseMode(): MouseMode {
    if (this.mouseModeType === 'default') {
      return {
        type: this.mouseModeType,
      };
    } else {
      return {
        type: this.mouseModeType,
        color: this.shapeModeColor,
        shape: this.shapeModeShape,
      };
    }
  }

  get page() {
    return this.editor.page;
  }

  get contentParser() {
    return this.editor.contentParser;
  }

  createRenderRoot() {
    return this;
  }

  private _onToggleConnection() {
    if (this.connected) {
      this.workspace.providers.forEach(provider => provider.disconnect());
      this.connected = false;
    } else {
      this.workspace.providers.forEach(provider => provider.connect());
      this.connected = true;
    }
  }

  private _convertToList(listType: 'bulleted' | 'numbered' | 'todo') {
    updateSelectedTextType('affine:list', listType, this.page);
  }

  private _onAddCodeBlock() {
    const selection = window.getSelection() as Selection;
    if (selection.rangeCount === 0) {
      throw new Error("Can't get start model by selection, rangeCount is 0");
    }

    const range = selection.getRangeAt(0);
    const startContainer =
      range.startContainer instanceof Text
        ? (range.startContainer.parentElement as HTMLElement)
        : (range.startContainer as HTMLElement);

    const startComponent = startContainer.closest(`[data-block-id]`) as {
      model?: BaseBlockModel;
    };
    const startModel = startComponent.model as BaseBlockModel;
    const parent = this.page.getParent(startModel);
    const index = parent?.children.indexOf(startModel);
    assertExists(parent);
    const blockProps = {
      flavour: 'affine:code-block',
      text: startModel.text?.clone(),
    };
    this.page.deleteBlock(startModel);
    this.page.addBlock(blockProps, parent, index);
  }

  private _onDelete() {
    // TODO delete selected block from menu
  }

  private _convertToParagraph(type: string) {
    updateSelectedTextType('affine:paragraph', type, this.page);
  }

  private _onSwitchMode() {
    this.editor.mode = this.editor.mode === 'page' ? 'edgeless' : 'page';
  }

  private _onAddGroup() {
    const root = this.page.root;
    if (!root) return;
    const pageId = root.id;

    this.page.captureSync();

    const count = root.children.length;
    const xywh = `[0,${count * 60},720,480]`;

    const groupId = this.page.addBlock<GroupBlockModel>(
      { flavour: 'affine:group', xywh },
      pageId
    );
    this.page.addBlock({ flavour: 'affine:paragraph' }, groupId);
  }

  private _onSwitchMouseMode() {
    this.mouseModeType = this.mouseModeType === 'default' ? 'shape' : 'default';
  }

  private _onExportHtml() {
    this.contentParser.onExportHtml();
  }

  private _onToggleReadonly() {
    this.editor.readonly = !this.editor.readonly;
    this.readonly = !this.readonly;
  }

  private _onExportMarkDown() {
    this.contentParser.onExportMarkdown();
  }

  private _shareUrl() {
    const base64 = this.workspace.toBase64();
    const url = new URL(window.location.toString());
    url.searchParams.set('init', base64);
    window.history.pushState({}, '', url);
  }

  firstUpdated() {
    this.page.signals.historyUpdated.on(() => {
      this.canUndo = this.page.canUndo;
      this.canRedo = this.page.canRedo;
    });
  }

  update(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('mouseModeType') ||
      changedProperties.has('shapeModeColor') ||
      changedProperties.has('shapeModeShape')
    ) {
      const event = createEvent('affine.switch-mouse-mode', this.mouseMode);
      window.dispatchEvent(event);
    }
    super.update(changedProperties);
  }

  render() {
    return html`
      <style>
        .debug-menu {
          display: flex;
          flex-wrap: wrap;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000; /* for debug visibility */
        }
        .debug-menu > button {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: 2px;
          margin-top: 2px;
          width: 26px;
          height: 22px;
          border: 0;
          border-radius: 2px;
          background-color: var(--affine-border-color);
          color: var(--affine-text-color);
          transition: all 0.3s;
          cursor: pointer;
        }
        .debug-menu > button:hover {
          background-color: var(--affine-hover-background);
        }
        .debug-menu > button:disabled,
        .debug-menu > button:disabled:hover {
          opacity: 0.5;
          background-color: var(--affine-border-color);
          cursor: default;
        }
        .debug-menu > button path {
          fill: var(--affine-text-color);
        }
        .debug-menu > button > * {
          flex: 1;
        }
      </style>
      <div class="debug-menu">
        <button
          aria-label="undo"
          title="undo"
          .disabled=${!this.canUndo}
          tabindex="-1"
          @click=${() => this.page.undo()}
        >
          ${icons.undo}
        </button>
        <button
          aria-label="redo"
          title="redo"
          .disabled=${!this.canRedo}
          tabindex="-1"
          @click=${() => this.page.redo()}
        >
          ${icons.redo}
        </button>
        <button
          aria-label="heading-1"
          title="heading-1"
          tabindex="-1"
          @click=${() => this._convertToParagraph('h1')}
        >
          𝐇𝟏
        </button>
        <button
          aria-label="heading-2"
          title="heading-2"
          tabindex="-1"
          @click=${() => this._convertToParagraph('h2')}
        >
          𝐇𝟐
        </button>
        <button
          aria-label="heading-3"
          title="heading-3"
          tabindex="-1"
          @click=${() => this._convertToParagraph('h3')}
        >
          𝐇𝟑
        </button>
        <button
          aria-label="heading-4"
          title="heading-4"
          tabindex="-1"
          @click=${() => this._convertToParagraph('h4')}
        >
          𝐇𝟒
        </button>
        <button
          aria-label="heading-5"
          title="heading-5"
          tabindex="-1"
          @click=${() => this._convertToParagraph('h5')}
        >
          𝐇𝟓
        </button>
        <button
          aria-label="heading-6"
          title="heading-6"
          tabindex="-1"
          @click=${() => this._convertToParagraph('h6')}
        >
          𝐇𝟔
        </button>
        <button
          aria-label="text"
          title="text"
          tabindex="-1"
          @click=${() => this._convertToParagraph('text')}
        >
          𝐓
        </button>
        <button
          aria-label="quote"
          title="quote"
          tabindex="-1"
          @click=${() => this._convertToParagraph('quote')}
        >
          ${icons.quote}
        </button>
        <button
          aria-label="convert to bulleted list"
          title="convert to bulleted list"
          tabindex="-1"
          @click=${() => this._convertToList('bulleted')}
        >
          ${icons.ul}
        </button>
        <button
          aria-label="convert to numbered list"
          title="convert to numbered list"
          tabindex="-1"
          @click=${() => this._convertToList('numbered')}
        >
          ${icons.ol}
        </button>
        <button
          aria-label="convert to todo list"
          title="convert to todo list"
          tabindex="-1"
          @click=${() => this._convertToList('todo')}
        >
          ${icons.checklist}
        </button>
        <!--
        <button
          aria-label="delete"
          title="delete"
          disabled
          tabindex="-1"
          @click=${this._onDelete}
        >
          ❌
        </button>
        -->
        <button
          aria-label=${this.connected ? 'disconnect' : 'connect'}
          title=${this.connected ? 'disconnect' : 'connect'}
          tabindex="-1"
          @click=${this._onToggleConnection}
        >
          ${this.connected ? icons.connected : icons.disconnected}
        </button>
        <button
          aria-label="switch mode"
          title="switch mode"
          tabindex="-1"
          @click=${this._onSwitchMode}
        >
          ${icons.switchMode}
        </button>
        <button
          aria-label="add group"
          title="add group"
          tabindex="-1"
          @click=${this._onAddGroup}
        >
          ${icons.addGroup}
        </button>
        <button
          aria-label="code block"
          title="code block"
          tabindex="-1"
          @click=${this._onAddCodeBlock}
        >
          <>
        </button>
        <button
          aria-label="switch mouse mode"
          title="switch mouse mode"
          tabindex="-1"
          @click=${this._onSwitchMouseMode}
        >
          ${this.mouseMode.type === 'default'
            ? icons.mouseDefaultMode
            : icons.mouseShapeMode}
        </button>
        <button
          aria-label="export markdown"
          title="export markdown"
          tabindex="-1"
          @click=${this._onExportMarkDown}
        >
          ${icons.markdown}
        </button>
        <button
          aria-label="export html"
          title="export html"
          tabindex="-1"
          @click=${this._onExportHtml}
        >
          ${icons.html}
        </button>
        <button aria-label="clear data" title="clear data" disabled>
          ${icons.trash}
        </button>
        <button
          aria-label="toggle readonly"
          title="toggle readonly"
          tabindex="-1"
          @click=${this._onToggleReadonly}
        >
          ${this.readonly ? icons.unReadonly : icons.readonly}
        </button>
        <button
          aria-label="share url"
          title="share url"
          tabindex="-1"
          @click=${this._shareUrl}
        >
          ${icons.share}
        </button>
        <select
          style="width: 72px"
          aria-label="switch shape color"
          title="switch shape color"
          name="switch shape color"
          tabindex="-1"
          @change=${(e: Event) => {
            const target = e.target;
            if (target instanceof HTMLSelectElement) {
              const color = target.value as ColorStyle;
              this.shapeModeColor = color;
            }
          }}
        >
          <optgroup label="select a shape color">
            ${Object.entries(ColorStyle).map(([name, style]) => {
              return html`
                <option value=${style} ?selected=${style === ColorStyle.Black}>
                  ${name}
                </option>
              `;
            })}
          </optgroup>
        </select>
        <select
          style="width: 72px"
          aria-label="switch shape type"
          title="switch shape type"
          name="switch shape type"
          tabindex="-1"
          @change=${(e: Event) => {
            const target = e.target;
            if (target instanceof HTMLSelectElement) {
              const shape = target.value as TDShapeType;
              this.shapeModeShape = shape;
            }
          }}
        >
          <optgroup label="select a shape color">
            ${Object.entries(TDShapeType).map(([name, style]) => {
              if (
                style === TDShapeType.Triangle ||
                style === TDShapeType.Rectangle
              ) {
                return html`
                  <option
                    value=${style}
                    ?selected=${style === TDShapeType.Rectangle}
                  >
                    ${name}
                  </option>
                `;
              }
              return null;
            })}
          </optgroup>
        </select>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'debug-menu': DebugMenu;
  }
}
