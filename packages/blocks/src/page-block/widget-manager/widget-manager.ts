/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import { assertExists } from '@blocksuite/store';
import { html, type TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeStatic } from 'lit/static-html.js';

import type { PageBlockComponent } from '../types.js';

export class WidgetManager {
  constructor(public host: PageBlockComponent) {}

  private get _root() {
    return this.host.root;
  }

  private get _view() {
    const model = this.host.model;
    const flavour = model.flavour;
    const view = this._root.blockStore.specStore.getView(flavour);
    assertExists(view);
    return view;
  }

  private get _widgets() {
    const widgets = this._view.widgets;
    return widgets;
  }

  private get _widgetIdAttr() {
    return this._root.widgetIdAttr;
  }

  private get _page() {
    return this.host.page;
  }

  get(name: keyof PageBlockComponent['widgets']) {
    if (!this._widgets) {
      throw new Error(`Widgets in host ${this.host.tagName} not found`);
    }

    const widget = this._widgets[name];
    if (!widget) {
      throw new Error(
        `Widget "${name}" in host ${this.host.tagName} not found`
      );
    }

    return widget;
  }

  render(filter = (name: string) => true): TemplateResult {
    if (!this._widgets) {
      throw new Error(`Widgets in host ${this.host.tagName} not found`);
    }

    const filteredWidgets = Object.fromEntries(
      Object.entries(this._widgets).filter(([name]) => filter(name))
    );

    return html`${repeat(
      Object.entries(filteredWidgets),
      ([id]) => id,
      ([name, widgetTag]) => {
        return html`<${widgetTag} ${unsafeStatic(
          this._widgetIdAttr
        )}=${name} .root=${this._root} .page=${this._page}></${widgetTag}>`;
      }
    )}`;
  }
}
