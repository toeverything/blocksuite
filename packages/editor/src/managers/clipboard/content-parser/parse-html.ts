import type { ContentParser } from '.';
import type { OpenBlockInfo } from '../types';

export class ParserHtml {
  private _contentParser: ContentParser;
  constructor(contentParser: ContentParser) {
    this._contentParser = contentParser;
  }

  public registerParsers() {
    this._contentParser.registerParserHtmlText2Block(
      'nodeParser',
      this._nodePaser.bind(this)
    );
    this._contentParser.registerParserHtmlText2Block(
      'textParser',
      this._textPaser.bind(this)
    );
    this._contentParser.registerParserHtmlText2Block(
      'commonParser',
      this._commonParser.bind(this)
    );
  }

  private _nodePaser(node: Element): OpenBlockInfo[] | null {
    if (node.nodeType === 3) {
      return this._contentParser.getParserHtmlText2Block('textParser')(node);
    }
    if (node.nodeType !== 1) {
      return [];
    }
    const tagName = node.tagName;
    let result;
    if (['DIV', 'P', 'B', 'A', 'EM', 'U', 'S', 'DEL'].includes(tagName)) {
      result = this._contentParser.getParserHtmlText2Block('textParser')(node);
    }
    if (result && result.length > 0) {
      return result;
    }
    return Array.from(node.childNodes)
      .map(childElement => {
        const clipBlockInfos =
          this._contentParser.getParserHtmlText2Block('nodeParser')?.(
            childElement
          ) || [];

        if (clipBlockInfos && clipBlockInfos.length) {
          return clipBlockInfos;
        }
        return [];
      })
      .flat()
      .filter(v => v);
  }

  private _commonParser({
    element,
    tagName,
    flavour,
    type,
    ignoreEmptyElement = true,
  }: {
    element: Element;
    tagName: string | string[];
    flavour: string;
    type: string;
    ignoreEmptyElement?: boolean;
  }): OpenBlockInfo[] | null {
    const tagNames = typeof tagName === 'string' ? [tagName] : tagName;
    if (tagNames.includes(element.tagName)) {
      const res = this._commonHTML2Block(
        element,
        flavour,
        type,
        ignoreEmptyElement
      );
      return res ? [res] : null;
    }
    return null;
  }

  private _textPaser(element: Element): OpenBlockInfo[] | null {
    return this._contentParser.getParserHtmlText2Block('commonParser')?.({
      element,
      flavour: 'paragraph',
      type: 'text',
      tagName: ['DIV', 'P', 'B', 'A', 'EM', 'U', 'S', 'DEL'],
    });
  }

  private _commonHTML2Block(
    element: HTMLElement | Node,
    flavour: string,
    type: string,
    ignoreEmptyElement = true
  ): OpenBlockInfo | null {
    const textValue = this._commonHTML2Text(element, {}, ignoreEmptyElement);
    if (!textValue.length && ignoreEmptyElement) {
      return null;
    }
    return {
      flavour: flavour,
      type: type,
      text: textValue,
      children: [],
    };
  }

  private _commonHTML2Text(
    element: HTMLElement | Node,
    textStyle: { [key: string]: unknown } = {},
    ignoreEmptyText = true
  ) {
    if (element instanceof Text) {
      return (element.textContent || '').split('\n').map(text => {
        return {
          insert: text,
          attributes: textStyle,
        };
      });
    }
    const htmlElement = element as HTMLElement;
    const childNodes = Array.from(htmlElement.childNodes);

    const isLink = getIsLink(htmlElement);
    const currentTextStyle = getTextStyle(htmlElement);

    if (!childNodes.length) {
      // todo
      // const singleLabelContent = getSingleLabelHTMLElementContent(htmlElement);
      // if (isLink && singleLabelContent) {
      //   return [
      //     {
      //       children: [
      //         {
      //           text: singleLabelContent,
      //         },
      //       ],
      //       ...currentTextStyle,
      //     },
      //   ];
      // }
      return ignoreEmptyText
        ? []
        : [
            {
              insert: '',
              attributes: currentTextStyle,
            },
          ];
    }

    const childTexts = childNodes
      .reduce((result, childNode) => {
        const textBlocks = this._commonHTML2Text(
          childNode,
          isLink
            ? textStyle
            : {
                ...textStyle,
                ...currentTextStyle,
              },
          ignoreEmptyText
        );
        result.push(...textBlocks);
        return result;
      }, [] as unknown[])
      .filter(v => v);

    // todo
    // if (isLink && childTexts.length) {
    //   return [
    //     {
    //       children: childTexts,
    //       ...currentTextStyle,
    //     },
    //   ];
    // }
    return childTexts;
  }
}

const getIsLink = (htmlElement: HTMLElement) => {
  return ['A', 'IMG'].includes(htmlElement.tagName);
};

const getTextStyle = (htmlElement: HTMLElement) => {
  const tagName = htmlElement.tagName;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textStyle: { [key: string]: any } = {};

  const style = (htmlElement.getAttribute('style') || '')
    .split(';')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((style: { [key: string]: any }, styleString) => {
      const [key, value] = styleString.split(':');
      if (key && value) {
        style[key] = value;
      }
      return style;
    }, {});

  if (
    style['font-weight'] === 'bold' ||
    Number(style['font-weight']) > 400 ||
    ['STRONG', 'B', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(
      htmlElement.tagName
    )
  ) {
    textStyle['bold'] = true;
  }
  if (getIsLink(htmlElement)) {
    textStyle['type'] = 'link';
    textStyle['url'] =
      htmlElement.getAttribute('href') || htmlElement.getAttribute('src');
    // todo
    // textStyle['id'] = getRandomString('link');
  }

  if (tagName === 'EM' || style['fontStyle'] === 'italic') {
    textStyle['italic'] = true;
  }
  if (
    tagName === 'U' ||
    (style['text-decoration'] &&
      style['text-decoration'].indexOf('underline') !== -1) ||
    style['border-bottom']
  ) {
    textStyle['underline'] = true;
  }
  if (tagName === 'CODE') {
    textStyle['inlinecode'] = true;
  }
  if (
    tagName === 'S' ||
    tagName === 'DEL' ||
    (style['text-decoration'] &&
      style['text-decoration'].indexOf('line-through') !== -1)
  ) {
    textStyle['strikethrough'] = true;
  }

  return textStyle;
};
