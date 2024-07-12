import {
  EdgelessEditorBlockSpecs,
  type InlineMarkdownMatch,
  type InlineSpecs,
  ListBlockService,
  PageEditorBlockSpecs,
  ParagraphBlockService,
} from '@blocksuite/blocks';
import {
  KEYBOARD_ALLOW_DEFAULT,
  KEYBOARD_PREVENT_DEFAULT,
} from '@blocksuite/inline';
import { html } from 'lit';
import { z } from 'zod';

import type { TextAttributesWithLatex } from './latex-node.js';

import './latex-node.js';

const latexSpec: InlineSpecs<TextAttributesWithLatex> = {
  embed: true,
  match: delta => !!delta.attributes?.latex,
  name: 'latex',
  renderer: (delta, selected) => {
    return html`<latex-node
      .delta=${delta}
      .selected=${selected}
    ></latex-node>`;
  },
  schema: z.string().optional().nullable().catch(undefined),
};
const latexMarkdownMatch: InlineMarkdownMatch<TextAttributesWithLatex> = {
  action: ({ inlineEditor, inlineRange, pattern, prefixText, undoManager }) => {
    const match = pattern.exec(prefixText);
    if (!match) {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    const annotatedText = match[0];
    const startIndex = inlineRange.index - annotatedText.length;

    if (prefixText.match(/^([* \n]+)$/g)) {
      return KEYBOARD_ALLOW_DEFAULT;
    }

    inlineEditor.insertText(
      {
        index: startIndex + annotatedText.length,
        length: 0,
      },
      ' '
    );
    inlineEditor.setInlineRange({
      index: startIndex + annotatedText.length + 1,
      length: 0,
    });

    undoManager.stopCapturing();

    inlineEditor.formatText(
      {
        index: startIndex,
        length: annotatedText.length,
      },
      {
        latex: String.raw`${match[1]}`,
      }
    );

    inlineEditor.deleteText({
      index: startIndex,
      length: annotatedText.length + 1,
    });
    inlineEditor.insertText(
      {
        index: startIndex,
        length: 0,
      },
      ' '
    );
    inlineEditor.formatText(
      {
        index: startIndex,
        length: 1,
      },
      {
        latex: String.raw`${match[1]}`,
      }
    );

    inlineEditor.setInlineRange({
      index: startIndex + 1,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
  name: 'latex',
  /* eslint-disable no-useless-escape */
  pattern: /(?:\$)([^\s\$](?:[^`]*?[^\s\$])?)(?:\$)$/g,
};

class CustomParagraphService extends ParagraphBlockService<TextAttributesWithLatex> {
  override mounted(): void {
    super.mounted();
    this.inlineManager.registerSpecs([...this.inlineManager.specs, latexSpec]);
    this.inlineManager.registerMarkdownMatches([
      ...this.inlineManager.markdownMatches,
      latexMarkdownMatch,
    ]);
  }
}
class CustomListService extends ListBlockService<TextAttributesWithLatex> {
  override mounted(): void {
    super.mounted();
    this.inlineManager.registerSpecs([...this.inlineManager.specs, latexSpec]);
    this.inlineManager.registerMarkdownMatches([
      ...this.inlineManager.markdownMatches,
      latexMarkdownMatch,
    ]);
  }
}

export function getLatexSpecs() {
  const pageModeSpecs = PageEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:paragraph') {
      return {
        ...spec,
        service: CustomParagraphService,
      };
    }
    if (spec.schema.model.flavour === 'affine:list') {
      return {
        ...spec,
        service: CustomListService,
      };
    }
    return spec;
  });
  const edgelessModeSpecs = EdgelessEditorBlockSpecs.map(spec => {
    if (spec.schema.model.flavour === 'affine:paragraph') {
      return {
        ...spec,
        service: CustomParagraphService,
      };
    }
    if (spec.schema.model.flavour === 'affine:list') {
      return {
        ...spec,
        service: CustomListService,
      };
    }
    return spec;
  });

  return {
    edgelessModeSpecs,
    pageModeSpecs,
  };
}
