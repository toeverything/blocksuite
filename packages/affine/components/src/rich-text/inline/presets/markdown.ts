/* eslint-disable no-useless-escape */

import type { BlockComponent, ExtensionType } from '@blocksuite/block-std';

import {
  KEYBOARD_ALLOW_DEFAULT,
  KEYBOARD_PREVENT_DEFAULT,
} from '@blocksuite/inline';

import { InlineMarkdownExtension } from '../../extension/markdown-matcher.js';

// inline markdown match rules:
// covert: ***test*** + space
// covert: ***t est*** + space
// not convert: *** test*** + space
// not convert: ***test *** + space
// not convert: *** test *** + space

export const BoldItalicMarkdown = InlineMarkdownExtension({
  name: 'bolditalic',
  pattern: /(?:\*\*\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*\*\*)$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
    const match = pattern.exec(prefixText);
    if (!match) {
      return KEYBOARD_ALLOW_DEFAULT;
    }

    const annotatedText = match[0];
    const startIndex = inlineRange.index - annotatedText.length;

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
        bold: true,
        italic: true,
      }
    );

    inlineEditor.deleteText({
      index: startIndex + annotatedText.length,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex + annotatedText.length - 3,
      length: 3,
    });
    inlineEditor.deleteText({
      index: startIndex,
      length: 3,
    });

    inlineEditor.setInlineRange({
      index: startIndex + annotatedText.length - 6,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const BoldMarkdown = InlineMarkdownExtension({
  name: 'bold',
  pattern: /(?:\*\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*\*)$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
    const match = pattern.exec(prefixText);
    if (!match) {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    const annotatedText = match[0];
    const startIndex = inlineRange.index - annotatedText.length;

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
        bold: true,
      }
    );

    inlineEditor.deleteText({
      index: startIndex + annotatedText.length,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex + annotatedText.length - 2,
      length: 2,
    });
    inlineEditor.deleteText({
      index: startIndex,
      length: 2,
    });

    inlineEditor.setInlineRange({
      index: startIndex + annotatedText.length - 4,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const ItalicExtension = InlineMarkdownExtension({
  name: 'italic',
  pattern: /(?:\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*)$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
    const match = pattern.exec(prefixText);
    if (!match) {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    const annotatedText = match[0];
    const startIndex = inlineRange.index - annotatedText.length;

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
        italic: true,
      }
    );

    inlineEditor.deleteText({
      index: startIndex + annotatedText.length,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex + annotatedText.length - 1,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex,
      length: 1,
    });

    inlineEditor.setInlineRange({
      index: startIndex + annotatedText.length - 2,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const StrikethroughExtension = InlineMarkdownExtension({
  name: 'strikethrough',
  pattern: /(?:~~)([^\s~](?:[^~]*?[^\s~])?)(?:~~)$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
    const match = pattern.exec(prefixText);
    if (!match) {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    const annotatedText = match[0];
    const startIndex = inlineRange.index - annotatedText.length;

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
        strike: true,
      }
    );

    inlineEditor.deleteText({
      index: startIndex + annotatedText.length,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex + annotatedText.length - 2,
      length: 2,
    });
    inlineEditor.deleteText({
      index: startIndex,
      length: 2,
    });

    inlineEditor.setInlineRange({
      index: startIndex + annotatedText.length - 4,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const UnderthroughExtension = InlineMarkdownExtension({
  name: 'underthrough',
  pattern: /(?:~)([^\s~](?:[^~]*?[^\s~])?)(?:~)$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
    const match = pattern.exec(prefixText);
    if (!match) {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    const annotatedText = match[0];
    const startIndex = inlineRange.index - annotatedText.length;

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
        underline: true,
      }
    );

    inlineEditor.deleteText({
      index: startIndex + annotatedText.length,
      length: 1,
    });
    inlineEditor.deleteText({
      index: inlineRange.index - 1,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex,
      length: 1,
    });

    inlineEditor.setInlineRange({
      index: startIndex + annotatedText.length - 2,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const CodeExtension = InlineMarkdownExtension({
  name: 'code',
  pattern: /(?:`)([^\s`](?:[^`]*?[^\s`])?)(?:`)$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
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
        code: true,
      }
    );

    inlineEditor.deleteText({
      index: startIndex + annotatedText.length,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex + annotatedText.length - 1,
      length: 1,
    });
    inlineEditor.deleteText({
      index: startIndex,
      length: 1,
    });

    inlineEditor.setInlineRange({
      index: startIndex + annotatedText.length - 2,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const LinkExtension = InlineMarkdownExtension({
  name: 'link',
  pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
    const startIndex = prefixText.search(pattern);
    const matchedText = prefixText.match(pattern)?.[0];
    const hrefText = prefixText.match(/(?:\[(.*?)\])/g)?.[0];
    const hrefLink = prefixText.match(/(?:\((.*?)\))/g)?.[0];
    if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    const start = inlineRange.index - matchedText.length;

    inlineEditor.insertText(
      {
        index: inlineRange.index,
        length: 0,
      },
      ' '
    );
    inlineEditor.setInlineRange({
      index: inlineRange.index + 1,
      length: 0,
    });

    undoManager.stopCapturing();

    inlineEditor.formatText(
      {
        index: start,
        length: hrefText.length,
      },
      {
        link: hrefLink.slice(1, hrefLink.length - 1),
      }
    );

    inlineEditor.deleteText({
      index: inlineRange.index + matchedText.length,
      length: 1,
    });
    inlineEditor.deleteText({
      index: inlineRange.index - hrefLink.length - 1,
      length: hrefLink.length + 1,
    });
    inlineEditor.deleteText({
      index: start,
      length: 1,
    });

    inlineEditor.setInlineRange({
      index: start + hrefText.length - 1,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const LatexExtension = InlineMarkdownExtension({
  name: 'latex',
  /* eslint-disable no-useless-escape */
  pattern:
    /(?:\$\$)(?<content>[^\s\$]+)(?:\$\$)$|(?<blockPrefix>\$\$\$\$)|(?<inlinePrefix>\$\$)$/g,
  action: ({ inlineEditor, prefixText, inlineRange, pattern, undoManager }) => {
    const match = pattern.exec(prefixText);
    if (!match || !match.groups) {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    const content = match.groups['content'];
    const inlinePrefix = match.groups['inlinePrefix'];
    const blockPrefix = match.groups['blockPrefix'];

    if (blockPrefix === '$$$$') {
      inlineEditor.insertText(
        {
          index: inlineRange.index,
          length: 0,
        },
        ' '
      );
      inlineEditor.setInlineRange({
        index: inlineRange.index + 1,
        length: 0,
      });

      undoManager.stopCapturing();

      const blockComponent =
        inlineEditor.rootElement.closest<BlockComponent>('[data-block-id]');
      if (!blockComponent) return KEYBOARD_ALLOW_DEFAULT;

      const doc = blockComponent.doc;
      const parentComponent = blockComponent.parentComponent;
      if (!parentComponent) return KEYBOARD_ALLOW_DEFAULT;

      const index = parentComponent.model.children.indexOf(
        blockComponent.model
      );
      if (index === -1) return KEYBOARD_ALLOW_DEFAULT;

      inlineEditor.deleteText({
        index: inlineRange.index - 4,
        length: 5,
      });

      const id = doc.addBlock(
        'affine:latex',
        {
          latex: '',
        },
        parentComponent.model,
        index + 1
      );
      blockComponent.host.updateComplete
        .then(() => {
          const latexBlock = blockComponent.std.view.getBlock(id);
          if (!latexBlock || latexBlock.flavour !== 'affine:latex') return;

          //FIXME(@Flrande): wait for refactor
          // @ts-ignore
          latexBlock.toggleEditor();
        })
        .catch(console.error);

      return KEYBOARD_PREVENT_DEFAULT;
    }

    if (inlinePrefix === '$$') {
      inlineEditor.insertText(
        {
          index: inlineRange.index,
          length: 0,
        },
        ' '
      );
      inlineEditor.setInlineRange({
        index: inlineRange.index + 1,
        length: 0,
      });

      undoManager.stopCapturing();

      inlineEditor.deleteText({
        index: inlineRange.index - 2,
        length: 3,
      });
      inlineEditor.insertText(
        {
          index: inlineRange.index - 2,
          length: 0,
        },
        ' '
      );
      inlineEditor.formatText(
        {
          index: inlineRange.index - 2,
          length: 1,
        },
        {
          latex: '',
        }
      );

      inlineEditor
        .waitForUpdate()
        .then(async () => {
          await inlineEditor.waitForUpdate();

          const textPoint = inlineEditor.getTextPoint(
            inlineRange.index - 2 + 1
          );
          if (!textPoint) return;

          const [text] = textPoint;
          const latexNode = text.parentElement?.closest('affine-latex-node');
          if (!latexNode) return;

          latexNode.toggleEditor();
        })
        .catch(console.error);

      return KEYBOARD_PREVENT_DEFAULT;
    }

    if (!content || content.length === 0) {
      return KEYBOARD_ALLOW_DEFAULT;
    }

    inlineEditor.insertText(
      {
        index: inlineRange.index,
        length: 0,
      },
      ' '
    );
    inlineEditor.setInlineRange({
      index: inlineRange.index + 1,
      length: 0,
    });

    undoManager.stopCapturing();

    const startIndex = inlineRange.index - 2 - content.length - 2;
    inlineEditor.deleteText({
      index: startIndex,
      length: 2 + content.length + 2 + 1,
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
        latex: String.raw`${content}`,
      }
    );

    inlineEditor.setInlineRange({
      index: startIndex + 1,
      length: 0,
    });

    return KEYBOARD_PREVENT_DEFAULT;
  },
});

export const MarkdownExtensions: ExtensionType[] = [
  BoldItalicMarkdown,
  BoldMarkdown,
  ItalicExtension,
  StrikethroughExtension,
  UnderthroughExtension,
  CodeExtension,
  LinkExtension,
  LatexExtension,
];
