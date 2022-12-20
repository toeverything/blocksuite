import type { BaseBlockModel } from '@blocksuite/store';
import type { Quill } from 'quill';
import type { RangeStatic } from 'quill';
import {
  ALLOW_DEFAULT,
  assertExists,
  getDefaultPageBlock,
  PREVENT_DEFAULT,
} from '../index.js';

type Match = {
  name: string;
  pattern: RegExp;
  action: (
    model: BaseBlockModel,
    quill: Quill,
    text: string,
    selection: RangeStatic,
    pattern: RegExp
  ) => boolean;
};

export class Shortcuts {
  public static match(
    quill: Quill,
    model: BaseBlockModel,
    prefix: string
  ): boolean {
    const selection = quill.getSelection();
    if (!selection) {
      return PREVENT_DEFAULT;
    }
    const [line] = quill.getLine(selection.index);
    if (Shortcuts._isValid(prefix, line.domNode.tagName)) {
      for (const match of Shortcuts._matches) {
        const matchedText = prefix.match(match.pattern);
        if (matchedText) {
          return match.action(model, quill, prefix, selection, match.pattern);
        }
      }
    }
    return PREVENT_DEFAULT;
  }

  private static _ignoreTags: string[] = ['PRE'];

  private static _matches: Match[] = [
    {
      name: 'bolditalic',
      pattern: /(?:\*){3}(.+?)(?:\*){3}$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return PREVENT_DEFAULT;
        }

        const annotatedText = match[0];
        const startIndex = selection.index - annotatedText.length;

        if (text.match(/^([* \n]+)$/g)) {
          return PREVENT_DEFAULT;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.page.captureSync();
        model.text?.format(startIndex, annotatedText.length, {
          bold: true,
          italic: true,
        });
        quill.setSelection(startIndex + annotatedText.length + 1, 0);

        model.text?.delete(startIndex + annotatedText.length, 1);
        model.text?.delete(startIndex + annotatedText.length - 3, 3);
        model.text?.delete(startIndex, 3);
        quill.format('bold', false);
        quill.format('italic', false);

        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'bold',
      pattern: /(?:\*){2}(.+?)(?:\*){2}$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return PREVENT_DEFAULT;
        }
        const annotatedText = match[0];
        const startIndex = selection.index - annotatedText.length;

        if (text.match(/^([* \n]+)$/g)) {
          return PREVENT_DEFAULT;
        }
        model.text?.insert(' ', startIndex + annotatedText.length);
        model.page.captureSync();
        model.text?.format(startIndex, annotatedText.length, {
          bold: true,
        });
        quill.setSelection(startIndex + annotatedText.length + 1, 0);

        model.text?.delete(startIndex + annotatedText.length, 1);
        model.text?.delete(startIndex + annotatedText.length - 2, 2);
        model.text?.delete(startIndex, 2);
        quill.format('bold', false);

        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'italic',
      pattern: /(?:\*){1}(.+?)(?:\*){1}$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return PREVENT_DEFAULT;
        }
        const annotatedText = match[0];
        const startIndex = selection.index - annotatedText.length;

        if (text.match(/^([* \n]+)$/g)) {
          return PREVENT_DEFAULT;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.page.captureSync();
        model.text?.format(startIndex, annotatedText.length, {
          italic: true,
        });
        quill.setSelection(startIndex + annotatedText.length + 1, 0);

        model.text?.delete(startIndex + annotatedText.length, 1);
        model.text?.delete(startIndex + annotatedText.length - 1, 1);
        model.text?.delete(startIndex, 1);
        quill.format('italic', false);

        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'strikethrough',
      pattern: /(?:~~)(.+?)(?:~~)$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return PREVENT_DEFAULT;
        }
        const annotatedText = match[0];
        const startIndex = selection.index - annotatedText.length;

        if (text.match(/^([* \n]+)$/g)) {
          return PREVENT_DEFAULT;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.page.captureSync();
        model.text?.format(startIndex, annotatedText.length, {
          strike: true,
        });
        quill.setSelection(startIndex + annotatedText.length + 1, 0);

        model.text?.delete(startIndex + annotatedText.length, 1);
        model.text?.delete(startIndex + annotatedText.length - 2, 2);
        model.text?.delete(startIndex, 2);
        quill.format('strike', false);

        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'underthrough',
      pattern: /(?:~)(.+?)(?:~)$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return PREVENT_DEFAULT;
        }
        const annotatedText = match[0];
        const startIndex = selection.index - annotatedText.length;

        if (text.match(/^([* \n]+)$/g)) {
          return PREVENT_DEFAULT;
        }

        model.text?.insert(' ', selection.index);
        model.page.captureSync();
        model.text?.format(startIndex, annotatedText.length, {
          underline: true,
        });
        quill.setSelection(startIndex + annotatedText.length + 1, 0);

        model.text?.delete(startIndex + annotatedText.length, 1);
        model.text?.delete(selection.index, 1);
        model.text?.delete(selection.index - 1, 1);
        model.text?.delete(startIndex, 1);
        quill.format('underline', false);

        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'code',
      pattern: /(?:`)([^`]+?)(?:`)$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return PREVENT_DEFAULT;
        }
        const annotatedText = match[0];
        const startIndex = selection.index - annotatedText.length;

        if (text.match(/^([* \n]+)$/g)) {
          return PREVENT_DEFAULT;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.page.captureSync();
        model.text?.format(startIndex, annotatedText.length, {
          code: true,
        });

        quill.setSelection(startIndex + annotatedText.length + 1, 0);
        model.text?.delete(startIndex + annotatedText.length, 1);
        model.text?.delete(startIndex + annotatedText.length - 1, 1);
        model.text?.delete(startIndex, 1);
        quill.format('code', false);

        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'codeblock',
      pattern: /^```/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        if (model.flavour === 'affine:paragraph' && model.type === 'quote') {
          return PREVENT_DEFAULT;
        }
        const page = getDefaultPageBlock(model).page;
        const parent = page.getParent(model);
        assertExists(parent);
        const index = parent.children.indexOf(model);
        const blockProps = {
          flavour: 'affine:code',
        };
        page.deleteBlock(model);
        page.addBlock(blockProps, parent, index);
        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'link',
      pattern:
        /(((https?|ftp|file):\/\/)|www.)[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return PREVENT_DEFAULT;
        }

        const annotatedText = match[0];
        const startIndex = selection.index - annotatedText.length;

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.page.captureSync();
        model.text?.format(startIndex, annotatedText.length, {
          link: annotatedText,
        });
        quill.setSelection(startIndex + annotatedText.length + 1, 0);

        model.text?.delete(startIndex + annotatedText.length, 1);
        quill.format('link', false);

        return ALLOW_DEFAULT;
      },
    },
    {
      name: 'link',
      pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
      action: (
        model: BaseBlockModel,
        quill: Quill,
        text: string,
        selection: RangeStatic,
        pattern: RegExp
      ) => {
        const startIndex = text.search(pattern);
        const matchedText = text.match(pattern)?.[0];
        const hrefText = text.match(/(?:\[(.*?)\])/g)?.[0];
        const hrefLink = text.match(/(?:\((.*?)\))/g)?.[0];
        if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
          return PREVENT_DEFAULT;
        }
        const start = selection.index - matchedText.length;

        model.text?.insert(' ', selection.index);
        model.page.captureSync();
        model.text?.format(start, hrefText.length, {
          link: hrefLink.slice(1, hrefLink.length - 1),
        });
        quill.setSelection(startIndex + matchedText.length + 1, 0);

        model.text?.delete(startIndex + matchedText.length, 1);
        model.text?.delete(
          selection.index - hrefLink.length - 1,
          hrefLink.length + 1
        );
        model.text?.delete(start, 1);
        quill.format('link', false);

        return ALLOW_DEFAULT;
      },
    },
  ];

  private static _isValid(text: string, tagName: string) {
    return (
      typeof text !== 'undefined' &&
      text &&
      Shortcuts._ignoreTags.indexOf(tagName) === -1
    );
  }
}
