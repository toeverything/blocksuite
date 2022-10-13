import Quill from 'quill';
import './styles.css';

const Inline = Quill.import('blots/inline');
export class MockSelectNode extends Inline {
  static blotName = 'mock-select';
  static tagName = 'span';
  static className = 'affine-mock-select';

  static create() {
    const node = super.create() as HTMLElement;
    return node;
  }

  static formats(node: HTMLElement) {
    return true;
  }

  format(name: string, value: boolean) {
    if (name !== this.statics.blotName || !value) {
      super.format(name, value);
    }
  }
}

// See https://quilljs.com/guides/how-to-customize-quill/#customizing-blots
// See https://github.com/quilljs/quill/blob/develop/formats/link.ts
Quill.register({ 'formats/mock-select': MockSelectNode }, true);
