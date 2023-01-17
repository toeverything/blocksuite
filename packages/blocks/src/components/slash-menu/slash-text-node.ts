import type { InlineBlot } from 'parchment';
import Quill from 'quill';
import { getModelByElement } from '../../__internal__/index.js';
import { showSlashMenu } from './index.js';
import type { SlashMenu } from './slash-menu-node.js';

// See https://github.com/quilljs/quill/blob/develop/blots/inline.ts
// See https://github.com/quilljs/parchment
const Inline: typeof InlineBlot = Quill.import('blots/inline');
export class SlashTextNode extends Inline {
  static override blotName = 'slash-text';
  static override tagName = 'span';
  static override className = 'affine-slash-text';
  private abortController = new AbortController();
  private slashMenu: SlashMenu | undefined;

  static override create(value: boolean) {
    const node = super.create(value) as HTMLElement;
    // TODO for debug, remove after stable
    node.style.backgroundColor = 'rgba(35, 131, 226, 0.28)';
    return node;
  }

  // Returns format values represented by domNode if it is this Blot's type
  // No checking that domNode is this Blot's type is required.
  static override formats(node: HTMLElement) {
    return true;
  }

  // Apply format to blot. Should not pass onto child or other blot.
  override format(name: string, value: boolean) {
    const node = this.domNode as HTMLElement;
    if (!value) {
      node.style.backgroundColor = '';
      if (!node.getAttribute('style')) {
        node.removeAttribute('style');
      }
    }
    if (name !== this.statics.blotName || !value) {
      super.format(name, value);
    }
  }

  // Called after update cycle completes. Cannot change the value or length
  // of the document, and any DOM operation must reduce complexity of the DOM
  // tree. A shared context object is passed through all blots.
  override optimize(context: { [key: string]: unknown }): void {
    super.optimize(context);
    const children = this.children;
    if (
      !children.head ||
      !('value' in children.head) ||
      !(children.head.value instanceof Function)
    ) {
      console.error('slash text search error', context, this, children);
      return;
    }
    const value: string = children.head.value();
    if (value.includes(' ')) {
      // Should hide slash menu when space is typed
      this.abortController.abort('ABORT');
    }
    if (!this.slashMenu) {
      return;
    }
    this.slashMenu.searchString = value.slice(1);
  }

  override attach(): void {
    super.attach();

    const model = getModelByElement(this.domNode);
    this.slashMenu = showSlashMenu({
      blot: this,
      model,
      anchorEl: this.domNode,
      abortController: this.abortController,
    });
  }

  override detach(): void {
    super.detach();
    this.abortController.abort('ABORT');
  }
}

// See https://quilljs.com/guides/how-to-customize-quill/#customizing-blots
// See https://github.com/quilljs/quill/blob/develop/formats/link.ts
Quill.register({ 'formats/slash-text': SlashTextNode });
