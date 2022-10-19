import { ContentParser } from '.';
import { OpenBlockInfo } from '../types';

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
      'commonParser',
      this._commonParser.bind(this)
    );
    this._contentParser.registerParserHtmlText2Block(
      'listItemParser',
      this._listItemParser.bind(this)
    );
  }
  // TODO parse children block
  private _nodePaser(node: Element): OpenBlockInfo[] | null {
    let result;
    // custom parser
    result =
      this._contentParser.getParserHtmlText2Block('customNodeParser')?.(node);
    if (result && result.length > 0) {
      return result;
    }

    if (node.nodeType === 3) {
      return this._contentParser.getParserHtmlText2Block('commonParser')?.({
        element: node,
        flavour: 'paragraph',
        type: 'text',
      });
    }
    if (node.nodeType !== 1) {
      return [];
    }
    const tagName = node.tagName;

    switch (tagName) {
      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
        result = this._contentParser.getParserHtmlText2Block('commonParser')?.({
          element: node,
          flavour: 'paragraph',
          type: tagName.toLowerCase(),
        });
        break;
      case 'P':
        if (
          node.firstChild instanceof Text &&
          (node.firstChild.textContent?.startsWith('[] ') ||
            node.firstChild.textContent?.startsWith('[ ] ') ||
            node.firstChild.textContent?.startsWith('[x] '))
        ) {
          result =
            this._contentParser.getParserHtmlText2Block('listItemParser')?.(
              node
            );
        } else {
          result = this._contentParser.getParserHtmlText2Block(
            'commonParser'
          )?.({
            element: node,
            flavour: 'paragraph',
            type: 'text',
          });
        }
        break;
      case 'DIV':
      case 'B':
      case 'A':
      case 'EM':
      case 'U':
      case 'S':
      case 'DEL':
        result = this._contentParser.getParserHtmlText2Block('commonParser')?.({
          element: node,
          flavour: 'paragraph',
          type: 'text',
        });
        break;
      case 'LI':
        result =
          this._contentParser.getParserHtmlText2Block('listItemParser')?.(node);
        break;
      default:
        break;
    }
    if (result && result.length > 0) {
      return result;
    }
    return Array.from(node.children)
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
    flavour,
    type,
    checked,
    ignoreEmptyElement = true,
  }: {
    element: Element;
    flavour: string;
    type: string;
    checked?: boolean;
    ignoreEmptyElement?: boolean;
  }): OpenBlockInfo[] | null {
    const res = this._commonHTML2Block(
      element,
      flavour,
      type,
      checked,
      ignoreEmptyElement
    );
    return res ? [res] : null;
  }

  private _commonHTML2Block(
    element: Element,
    flavour: string,
    type: string,
    checked?: boolean,
    ignoreEmptyElement = true
  ): OpenBlockInfo | null {
    const childNodes = element.childNodes;
    let isChildNode = false;
    const textValues: Record<string, unknown>[] = [];
    const children = [];
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes.item(i);
      if (!node) continue;
      if (!isChildNode) {
        if (node instanceof Text) {
          textValues.push(
            ...this._commonHTML2Text(node, {}, ignoreEmptyElement)
          );
          continue;
        }
        const htmlElement = node as HTMLElement;
        if (
          [
            'DEL',
            'STRONG',
            'B',
            'EM',
            'I',
            'U',
            'S',
            'P',
            'SPAN',
            'A',
            'INPUT',
            'MARK',
          ].includes(htmlElement.tagName)
        ) {
          textValues.push(
            ...this._commonHTML2Text(node, {}, ignoreEmptyElement)
          );
          continue;
        }
      }
      const childNode = this._nodePaser(node as Element);
      childNode && children.push(...childNode);
      isChildNode = true;
    }

    return {
      flavour: flavour,
      type: type,
      checked: checked,
      text: textValues,
      children: children,
    };
  }

  private _commonHTML2Text(
    element: Element | Node,
    textStyle: { [key: string]: unknown } = {},
    ignoreEmptyText = true
  ): Record<string, unknown>[] {
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
      }, [] as Record<string, unknown>[])
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

  private _listItemParser(element: HTMLElement): OpenBlockInfo[] | null {
    const tagName = element.parentElement?.tagName;
    let type = tagName === 'OL' ? 'numbered' : 'bulleted';
    let checked;
    let inputEl;
    if (
      (inputEl = element.firstElementChild)?.tagName === 'INPUT' ||
      (inputEl = element.firstElementChild?.firstElementChild)?.tagName ===
        'INPUT'
    ) {
      type = 'todo';
      checked = inputEl?.getAttribute('checked') !== null;
    }
    if (element.firstChild instanceof Text) {
      if (element.firstChild.textContent?.startsWith('[] ')) {
        element.firstChild.textContent =
          element.firstChild.textContent.slice(3);
        type = 'todo';
        checked = false;
      } else if (element.firstChild.textContent?.startsWith('[ ] ')) {
        element.firstChild.textContent =
          element.firstChild.textContent.slice(4);
        type = 'todo';
        checked = false;
      } else if (element.firstChild.textContent?.startsWith('[x] ')) {
        element.firstChild.textContent =
          element.firstChild.textContent.slice(4);
        type = 'todo';
        checked = true;
      }
    }
    const result = this._contentParser.getParserHtmlText2Block(
      'commonParser'
    )?.({
      element: element,
      flavour: 'list',
      type: type,
      checked: checked,
    });
    return result;
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
    textStyle['strike'] = true;
  }
  if (tagName === 'MARK') {
    textStyle['background'] = 'yellow';
  }

  return textStyle;
};
