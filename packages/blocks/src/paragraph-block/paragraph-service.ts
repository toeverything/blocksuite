import type { Service } from '../__internal__/index.js';
import type { ParagraphBlockModel } from './paragraph-model.js';

export class ParagraphBlockService implements Service {
  isLoaded = false;
  block2html(
    model: ParagraphBlockModel,
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const text = model.block2html(
      childText,
      previousSiblingId,
      nextSiblingId,
      begin,
      end
    );
    switch (model.type) {
      case 'text':
        return `<p>${text}</p>`;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return `<${model.type}>${text}</${model.type}>`;
      case 'quote':
        return `<blockquote>${text}</blockquote>`;
      default:
        return text;
    }
  }
}

export default ParagraphBlockService;
