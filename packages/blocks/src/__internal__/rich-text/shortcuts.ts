import { BaseBlockModel } from '@blocksuite/store';
import Quill, { RangeStatic } from 'quill';

type Match = {
  name: string;
  pattern: RegExp;
  action: (
    quill: Quill,
    model: BaseBlockModel,
    text: string,
    selection: RangeStatic,
    pattern: RegExp,
    lineStart: number
  ) => void;
};

export class Shortcuts {
  public static match(quill: Quill, model: BaseBlockModel) {
    const selection = quill.getSelection();
    if (!selection) return;
    const [line, offset] = quill.getLine(selection.index);
    const text = line.domNode.textContent;
    const lineStart = selection.index - offset;
    if (Shortcuts._isValid(text, line.domNode.tagName)) {
      for (const match of Shortcuts._matches) {
        const matchedText = text.match(match.pattern);
        if (matchedText) {
          // We need to replace only matched text not the whole line
          match.action(quill, model, text, selection, match.pattern, lineStart);
          return;
        }
      }
    }
  }

  private static _ignoreTags: string[] = ['PRE'];

  private static _matches: Match[] = [
    {
      name: 'bolditalic',
      pattern: /(?:\*|_){3}(.+?)(?:\*|_){3}/g,
      action: (
        quill: Quill,
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return;
        }

        const annotatedText = match[0];
        const matchedText = match[1];
        const startIndex = lineStart + match.index;

        if (text.match(/^([*_ \n]+)$/g)) {
          return;
        }

        quill.deleteText(startIndex, annotatedText.length);
        quill.insertText(startIndex, matchedText, {
          bold: true,
          italic: true,
        });
        quill.format('bold', false);
      },
    },
    {
      name: 'bold',
      pattern: /(?:\*|_){2}(.+?)(?:\*|_){2}/g,
      action: (
        quill: Quill,
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return;
        }
        const annotatedText = match[0];
        const matchedText = match[1];
        const startIndex = lineStart + match.index;

        if (text.match(/^([*_ \n]+)$/g)) {
          return;
        }

        quill.deleteText(startIndex, annotatedText.length);
        quill.insertText(startIndex, matchedText, { bold: true });
        quill.format('bold', false);
      },
    },
    {
      name: 'italic',
      pattern: /(?:\*|_){1}(.+?)(?:\*|_){1}/g,
      action: (
        quill: Quill,
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return;
        }
        const annotatedText = match[0];
        const matchedText = match[1];
        const startIndex = lineStart + match.index;

        if (text.match(/^([*_ \n]+)$/g)) {
          return;
        }

        quill.deleteText(startIndex, annotatedText.length);
        quill.insertText(startIndex, matchedText, { italic: true });
        quill.format('italic', false);
      },
    },
    {
      name: 'underthrough',
      pattern: /(?:~)(.+?)(?:~)/g,
      action: (
        quill: Quill,
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return;
        }
        const annotatedText = match[0];
        const matchedText = match[1];
        const startIndex = lineStart + match.index;

        if (text.match(/^([*_ \n]+)$/g)) {
          return;
        }

        quill.deleteText(startIndex, annotatedText.length);
        quill.insertText(startIndex, matchedText, { underline: true });
        quill.format('underline', false);
      },
    },
    {
      name: 'strikethrough',
      pattern: /(?:~~)(.+?)(?:~~)/g,
      action: (
        quill: Quill,
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return;
        }
        const annotatedText = match[0];
        const matchedText = match[1];
        const startIndex = lineStart + match.index;

        if (text.match(/^([*_ \n]+)$/g)) {
          return;
        }

        quill.deleteText(startIndex, annotatedText.length);
        quill.insertText(startIndex, matchedText, { strike: true });
        quill.format('strike', false);
      },
    },
    {
      name: 'link',
      pattern:
        /(((https?|ftp|file):\/\/)|www.)[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g,
      action: (
        quill: Quill,
        model: BaseBlockModel,
        text: string,
        selection: RangeStatic,
        pattern: RegExp,
        lineStart: number
      ) => {
        const match = pattern.exec(text);
        if (!match) {
          return;
        }
        const annotatedText = match[0];
        const startIndex = lineStart + match.index;
        model.text?.format(startIndex, annotatedText.length, {
          link: annotatedText,
        });
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
