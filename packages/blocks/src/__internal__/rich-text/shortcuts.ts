import { BaseBlockModel } from '@blocksuite/store';
import Quill, { RangeStatic } from 'quill';

type Match = {
  name: string;
  pattern: RegExp;
  action: (
    model: BaseBlockModel,
    text: string,
    selection: RangeStatic,
    pattern: RegExp,
    lineStart: number
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
      return false;
    }
    const [line, offset] = quill.getLine(selection.index);
    const lineStart = selection.index - offset;
    if (Shortcuts._isValid(prefix, line.domNode.tagName)) {
      for (const match of Shortcuts._matches) {
        const matchedText = prefix.match(match.pattern);
        if (matchedText) {
          return match.action(
            model,
            prefix,
            selection,
            match.pattern,
            lineStart
          );
        }
      }
    }
    return false;
  }

  private static _ignoreTags: string[] = ['PRE'];

  private static _matches: Match[] = [
    {
      name: 'bolditalic',
      pattern: /(?:\*){3}(.+?)(?:\*){3}$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return false;
        }

        const annotatedText = match[0];
        const startIndex = lineStart + match.index;

        if (text.match(/^([* \n]+)$/g)) {
          return false;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(startIndex + annotatedText.length, 1);
          model.text?.format(startIndex, annotatedText.length, {
            bold: true,
            italic: true,
          });
          model.text?.delete(startIndex + annotatedText.length - 3, 3);
          model.text?.delete(startIndex, 3);
        });
        return true;
      },
    },
    {
      name: 'bold',
      pattern: /(?:\*){2}(.+?)(?:\*){2}$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return false;
        }
        const annotatedText = match[0];
        const startIndex = lineStart + match.index;

        if (text.match(/^([* \n]+)$/g)) {
          return false;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(startIndex + annotatedText.length, 1);
          model.text?.format(startIndex, annotatedText.length, {
            bold: true,
          });
          model.text?.delete(startIndex + annotatedText.length - 2, 2);
          model.text?.delete(startIndex, 2);
        });
        return true;
      },
    },
    {
      name: 'italic',
      pattern: /(?:\*){1}(.+?)(?:\*){1}$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return false;
        }
        const annotatedText = match[0];
        const startIndex = lineStart + match.index;

        if (text.match(/^([* \n]+)$/g)) {
          return false;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(startIndex + annotatedText.length, 1);
          model.text?.format(startIndex, annotatedText.length, {
            italic: true,
          });
          model.text?.delete(startIndex + annotatedText.length - 1, 1);
          model.text?.delete(startIndex, 1);
        });
        return true;
      },
    },
    {
      name: 'strikethrough',
      pattern: /(?:~~)(.+?)(?:~~)$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return false;
        }
        const annotatedText = match[0];
        const startIndex = lineStart + match.index;

        if (text.match(/^([* \n]+)$/g)) {
          return false;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(startIndex + annotatedText.length, 1);
          model.text?.format(startIndex, annotatedText.length, {
            strike: true,
          });
          model.text?.delete(startIndex + annotatedText.length - 2, 2);
          model.text?.delete(startIndex, 2);
        });
        return true;
      },
    },
    {
      name: 'underthrough',
      pattern: /(?:~)(.+?)(?:~)$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return false;
        }
        const annotatedText = match[0];
        const startIndex = lineStart + match.index;

        if (text.match(/^([* \n]+)$/g)) {
          return false;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(startIndex + annotatedText.length, 1);
          model.text?.format(startIndex, annotatedText.length, {
            underline: true,
          });
          model.text?.delete(startIndex + annotatedText.length - 1, 1);
          model.text?.delete(startIndex, 1);
        });
        return true;
      },
    },
    {
      name: 'code',
      pattern: /(?:`)(.+?)(?:`)$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return false;
        }
        const annotatedText = match[0];
        const startIndex = lineStart + match.index;

        if (text.match(/^([* \n]+)$/g)) {
          return false;
        }

        model.text?.insert(' ', startIndex + annotatedText.length);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(startIndex + annotatedText.length, 1);
          model.text?.format(startIndex, annotatedText.length, {
            code: true,
          });
          model.text?.delete(startIndex + annotatedText.length - 1, 1);
          model.text?.delete(startIndex, 1);
        });
        return true;
      },
    },
    {
      name: 'link',
      pattern:
        /(((https?|ftp|file):\/\/)|www.)[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return false;
        }

        const annotatedText = match[0];
        const startIndex = lineStart + match.index;
        model.text?.insert(' ', startIndex + annotatedText.length);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(startIndex + annotatedText.length, 1);
          model.text?.format(startIndex, annotatedText.length, {
            link: annotatedText,
          });
        });
        return true;
      },
    },
    {
      name: 'link',
      pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
      action: (
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const startIndex = text.search(pattern);
        const matchedText = text.match(pattern)?.[0];
        const hrefText = text.match(/(?:\[(.*?)\])/g)?.[0];
        const hrefLink = text.match(/(?:\((.*?)\))/g)?.[0];
        if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
          return false;
        }
        const start = selection.index - matchedText.length;

        model.text?.insert(' ', selection.index);
        model.store.captureSync();
        model.store.transact(() => {
          model.text?.delete(selection.index, 1);
          model.text?.delete(
            selection.index - hrefLink.length - 1,
            hrefLink.length + 1
          );
          model.text?.delete(start, 1);
          model.text?.format(start, hrefText.length - 2, {
            link: hrefLink.slice(1, hrefLink.length - 1),
          });
        });
        return true;
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
