import Quill from 'quill';

const Inline = Quill.import('blots/inline');
// See https://github.com/quilljs/parchment
export class SlashTextNode extends Inline {
  static blotName = 'slash-text';
  static tagName = 'span';
  static className = 'affine-slash-text';

  static create(value: boolean) {
    const node = super.create() as HTMLElement;
    // TODO for debug, remove after stable
    node.style.backgroundColor = 'rgba(35, 131, 226, 0.28)';
    return node;
  }

  // Returns format values represented by domNode if it is this Blot's type
  // No checking that domNode is this Blot's type is required.
  static formats(node: HTMLElement) {
    return true;
  }

  // Apply format to blot. Should not pass onto child or other blot.
  format(name: string, value: boolean) {
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
}

// See https://quilljs.com/guides/how-to-customize-quill/#customizing-blots
// See https://github.com/quilljs/quill/blob/develop/formats/link.ts
Quill.register({ 'formats/slash-text': SlashTextNode });
