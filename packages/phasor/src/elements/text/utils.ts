// something comes from https://github.com/excalidraw/excalidraw/blob/b1311a407a636c87ee0ca326fd20599d0ce4ba9b/src/utils.ts

import type { ITextDelta } from './types.js';

const RS_LTR_CHARS =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
  '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF';
const RS_RTL_CHARS = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
// eslint-disable-next-line no-misleading-character-class
const RE_RTL_CHECK = new RegExp(`^[^${RS_LTR_CHARS}]*[${RS_RTL_CHARS}]`);
export const isRTL = (text: string) => RE_RTL_CHECK.test(text);

export const isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
export const isSafari =
  !isChrome && navigator.userAgent.indexOf('Safari') !== -1;

export const getFontString = ({
  fontSize,
  fontFamily,
}: {
  fontSize: number;
  fontFamily: string;
}) => {
  return `${fontSize}px ${fontFamily}`;
};

export function normalizeText(text: string): string {
  return (
    text
      // replace tabs with spaces so they render and measure correctly
      .replace(/\t/g, '        ')
      // normalize newlines
      .replace(/\r?\n|\r/g, '\n')
  );
}

export const splitIntoLines = (text: string) => {
  return normalizeText(text).split('\n');
};

export function getLineHeightInPx(
  fontSize: number,
  lineHeight: number
): number {
  return fontSize * lineHeight;
}

export function getTextHeight(
  text: string,
  fontSize: number,
  lineHeight: number
): number {
  const lineCount = splitIntoLines(text).length;
  return getLineHeightInPx(fontSize, lineHeight) * lineCount;
}

export function getLineWidth(text: string, font: string): number {
  const canvas = document.createElement('canvas');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const canvas2dContext = canvas.getContext('2d')!;
  canvas2dContext.font = font;
  const width = canvas2dContext.measureText(text).width;

  return width;
}

export function getTextWidth(text: string, font: string): number {
  const lines = splitIntoLines(text);
  let width = 0;
  lines.forEach(line => {
    width = Math.max(width, getLineWidth(line, font));
  });
  return width;
}

export function parseTokens(text: string): string[] {
  // Splitting words containing "-" as those are treated as separate words
  // by css wrapping algorithm eg non-profit => non-, profit
  const words = text.split('-');
  if (words.length > 1) {
    // non-proft org => ['non-', 'profit org']
    words.forEach((word, index) => {
      if (index !== words.length - 1) {
        words[index] = word += '-';
      }
    });
  }
  // Joining the words with space and splitting them again with space to get the
  // final list of tokens
  // ['non-', 'profit org'] =>,'non- proft org' => ['non-','profit','org']
  return words.join(' ').split(' ');
}

export const charWidth = (() => {
  const cachedCharWidth: { [key: string]: Array<number> } = {};

  const calculate = (char: string, font: string) => {
    const ascii = char.charCodeAt(0);
    if (!cachedCharWidth[font]) {
      cachedCharWidth[font] = [];
    }
    if (!cachedCharWidth[font][ascii]) {
      const width = getLineWidth(char, font);
      cachedCharWidth[font][ascii] = width;
    }

    return cachedCharWidth[font][ascii];
  };

  const getCache = (font: string) => {
    return cachedCharWidth[font];
  };
  return {
    calculate,
    getCache,
  };
})();

export function wrapText(text: string, font: string, maxWidth: number): string {
  // if maxWidth is not finite or NaN which can happen in case of bugs in
  // computation, we need to make sure we don't continue as we'll end up
  // in an infinite loop
  if (!Number.isFinite(maxWidth) || maxWidth < 0) {
    return text;
  }

  const lines: Array<string> = [];
  const originalLines = text.split('\n');
  const spaceWidth = getLineWidth(' ', font);

  let currentLine = '';
  let currentLineWidthTillNow = 0;

  const push = (str: string) => {
    if (str.trim()) {
      lines.push(str);
    }
  };

  const resetParams = () => {
    currentLine = '';
    currentLineWidthTillNow = 0;
  };
  originalLines.forEach(originalLine => {
    const currentLineWidth = getTextWidth(originalLine, font);

    // Push the line if its <= maxWidth
    if (currentLineWidth <= maxWidth) {
      lines.push(originalLine);
      return; // continue
    }

    const words = parseTokens(originalLine);
    resetParams();

    let index = 0;

    while (index < words.length) {
      const currentWordWidth = getLineWidth(words[index], font);

      // This will only happen when single word takes entire width
      if (currentWordWidth === maxWidth) {
        push(words[index]);
        index++;
      }

      // Start breaking longer words exceeding max width
      else if (currentWordWidth > maxWidth) {
        // push current line since the current word exceeds the max width
        // so will be appended in next line

        push(currentLine);

        resetParams();

        while (words[index].length > 0) {
          const currentChar = String.fromCodePoint(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            words[index].codePointAt(0)!
          );
          const width = charWidth.calculate(currentChar, font);
          currentLineWidthTillNow += width;
          words[index] = words[index].slice(currentChar.length);

          if (currentLineWidthTillNow >= maxWidth) {
            push(currentLine);
            currentLine = currentChar;
            currentLineWidthTillNow = width;
          } else {
            currentLine += currentChar;
          }
        }
        // push current line if appending space exceeds max width
        if (currentLineWidthTillNow + spaceWidth >= maxWidth) {
          push(currentLine);
          resetParams();
          // space needs to be appended before next word
          // as currentLine contains chars which couldn't be appended
          // to previous line unless the line ends with hyphen to sync
          // with css word-wrap
        } else if (!currentLine.endsWith('-')) {
          currentLine += ' ';
          currentLineWidthTillNow += spaceWidth;
        }
        index++;
      } else {
        // Start appending words in a line till max width reached
        while (currentLineWidthTillNow < maxWidth && index < words.length) {
          const word = words[index];
          currentLineWidthTillNow = getLineWidth(currentLine + word, font);

          if (currentLineWidthTillNow > maxWidth) {
            push(currentLine);
            resetParams();

            break;
          }
          index++;

          // if word ends with "-" then we don't need to add space
          // to sync with css word-wrap
          const shouldAppendSpace = !word.endsWith('-');
          currentLine += word;

          if (shouldAppendSpace) {
            currentLine += ' ';
          }

          // Push the word if appending space exceeds max width
          if (currentLineWidthTillNow + spaceWidth >= maxWidth) {
            if (shouldAppendSpace) {
              lines.push(currentLine.slice(0, -1));
            } else {
              lines.push(currentLine);
            }
            resetParams();
            break;
          }
        }
      }
    }
    if (currentLine.slice(-1) === ' ') {
      // only remove last trailing space which we have added when joining words
      currentLine = currentLine.slice(0, -1);
      push(currentLine);
    }
  });
  return lines.join('\n');
}

function transformDelta(delta: ITextDelta): (ITextDelta | '\n')[] {
  const result: (ITextDelta | '\n')[] = [];

  let tmpString = delta.insert;
  while (tmpString.length > 0) {
    const index = tmpString.indexOf('\n');
    if (index === -1) {
      result.push({
        insert: tmpString,
        attributes: delta.attributes,
      });
      break;
    }

    if (tmpString.slice(0, index).length > 0) {
      result.push({
        insert: tmpString.slice(0, index),
        attributes: delta.attributes,
      });
    }

    result.push('\n');
    tmpString = tmpString.slice(index + 1);
  }

  return result;
}

/**
 * convert a delta insert array to chunks, each chunk is a line
 */
export function deltaInsertsToChunks(delta: ITextDelta[]): ITextDelta[][] {
  if (delta.length === 0) {
    return [[]];
  }

  const transformedDelta = delta.flatMap(transformDelta);

  function* chunksGenerator(arr: (ITextDelta | '\n')[]) {
    let start = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '\n') {
        const chunk = arr.slice(start, i);
        start = i + 1;
        yield chunk as ITextDelta[];
      } else if (i === arr.length - 1) {
        yield arr.slice(start) as ITextDelta[];
      }
    }

    if (arr.at(-1) === '\n') {
      yield [];
    }
  }

  return [...chunksGenerator(transformedDelta)];
}
