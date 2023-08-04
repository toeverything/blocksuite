export class MarkdownUtils {
  private static _checkRegArr: RegExp[] = [
    /^(#{1,6})[ \t]*(.+?)[ \t]*#*\n+/m, // header
    /^ {0,3}\|?.+\|.+\n {0,3}\|?[ \t]*:?[ \t]*(?:[-=]){2,}[ \t]*:?[ \t]*\|[ \t]*:?[ \t]*(?:[-=]){2,}[\s\S]+?(?:\n\n|¨0)/m, // table
    /(?:^|\n)(?: {0,3})(```+|~~~+)(?: *)([^\s`~]*)\n([\s\S]*?)\n(?: {0,3})\1/, // codeBlock
    /(\n\n|^\n?)(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/m, // list
    /!\[([^\]]*?)] ?(?:\n *)?\[([\s\S]*?)]/, // referenceImage
    /!\[([^\]]*?)][ \t]*\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/, // inlineImage
    /!\[([^\]]*?)][ \t]*\([ \t]?<([^>]*)>(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(?:(["'])([^"]*?)\6))?[ \t]?\)/, // crazyImage
    /!\[([^\]]*?)][ \t]*\([ \t]?<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/, // base64Image
    // eslint-disable-next-line
    /\[((?:\[[^\]]*]|[^\[\]])*)][ \t]*\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/, // Generallink
    // eslint-disable-next-line
    /\[((?:\[[^\]]*]|[^\[\]])*)] ?(?:\n *)?\[(.*?)]/, // inlineLink
    // eslint-disable-next-line
    /\[((?:\[[^\]]*]|[^\[\]])*)][ \t]*\([ \t]?<([^>]*)>(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/, // special link
  ];

  /** Extract some grammar rules to check whether a piece of text contains markdown grammar */
  checkIfTextContainsMd(text: string) {
    text = text.replace(/¨/g, '¨T');
    text = text.replace(/\$/g, '¨D'); // replace $ with ¨D
    // Standardize the line position (unify mac, dos)
    text = text.replace(/\r\n/g, '\n'); // dos
    text = text.replace(/\r/g, '\n'); // mac
    text = text.replace(/\u00A0/g, '&nbsp;'); // normalize spaces
    // 2. Due to the grammatical characteristics of markdown (one \n is not counted as a newline, two are counted), let the start and end of the text be a pair of newlines, so as to ensure that the first and last lines of the pasted content can be recognized normally
    text = `\n\n${text}\n\n`; // 3. Convert tab to space
    text = MarkdownUtils._detab(text); // 4. Delete lines consisting only of space and tab

    for (let i = 0; i < MarkdownUtils._checkRegArr.length; i++) {
      const text1 = i === 3 ? `${text}¨0` : text;
      if (MarkdownUtils._checkRegArr[i].test(text1)) {
        return true;
      }
    }

    return false;
  }

  private static _detab(text: string) {
    text = text.replace(/\t(?=\t)/g, ' '); // 1 tab === 4 space
    // turn \t into a placeholder
    text = text.replace(/\t/g, '¨A¨B');
    // Use placeholders to mark tabs to prevent regular backtracking
    text = text.replace(/¨B(.+?)¨A/g, (_wholeMatch, m1) => {
      let leadingText = m1;
      const numSpaces = 4 - (leadingText.length % 4);

      for (let i = 0; i < numSpaces; i++) {
        leadingText += ' ';
      }

      return leadingText;
    });
    // Convert placeholder to space
    text = text.replace(/¨A/g, ' ');
    text = text.replace(/¨B/g, '');
    return text;
  }
}

export default new MarkdownUtils();
