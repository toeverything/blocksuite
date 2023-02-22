import { handleUnindent } from '../__internal__/rich-text/rich-text-operations.js';
import { BaseService } from '../__internal__/service/index.js';
import type { ParagraphBlockModel } from './paragraph-model.js';

export class ParagraphBlockService extends BaseService {
  block2html(
    model: ParagraphBlockModel,
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const text = super.block2html(
      model,
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

  /**
   * side effect when update block type
   */
  updateTypeEffect(model: ParagraphBlockModel, newType: string) {
    // if change to header, move all children to parent level
    if (newType.startsWith('h')) {
      let len = model.children.length;
      while (len > 0) {
        if (model.children[0]) {
          handleUnindent(model.page, model.children[0]);
          len--;
        } else {
          break;
        }
      }
    }
  }
}

export default ParagraphBlockService;
