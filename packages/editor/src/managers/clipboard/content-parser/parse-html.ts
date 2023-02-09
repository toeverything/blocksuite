import { assertExists } from '@blocksuite/global/utils';
import type { DeltaOperation } from 'quill';

import type { EditorContainer } from '../../../components/index.js';
import type { OpenBlockInfo } from '../types.js';
import type { ContentParser } from './index.js';

// There are these uncommon in-line tags that have not been added
// tt, acronym, dfn, kbd, samp, var, bdo, br, img, map, object, q, script, sub, sup, button, select, TEXTAREA
const INLINE_TAGS = [
  'DEL',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'SPAN',
  'A',
  'INPUT',
  'MARK',
  'CODE',
  'LABEL',
  'BIG',
  'SMALL',
  'ABBR',
  'CITE',
];

export class HtmlParser {
  private _contentParser: ContentParser;
  private _editor: EditorContainer;

  constructor(contentParser: ContentParser, editor: EditorContainer) {
    this._contentParser = contentParser;
    this._editor = editor;
  }

  public registerParsers() {
    this._contentParser.registerParserHtmlText2Block(
      'nodeParser',
      this._nodeParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'commonParser',
      this._commonParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'listItemParser',
      this._listItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'blockQuoteParser',
      this._blockQuoteParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'codeBlockParser',
      this._codeBlockParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'embedItemParser',
      this._embedItemParser
    );
  }

  // TODO parse children block
  private _nodeParser = async (
    node: Element
  ): Promise<OpenBlockInfo[] | null> => {
    let result;
    // custom parser
    result = await this._contentParser.getParserHtmlText2Block(
      'customNodeParser'
    )?.(node);
    if (result && result.length > 0) {
      return result;
    }

    const tagName = node.tagName;
    const isInlineOrLeaf =
      node instanceof Text || INLINE_TAGS.includes(tagName);
    if (isInlineOrLeaf && node.textContent?.length) {
      result = await this._contentParser.getParserHtmlText2Block(
        'commonParser'
      )?.({
        element: node,
        flavour: 'affine:paragraph',
        type: 'text',
      });
    } else {
      switch (tagName) {
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          result = await this._contentParser.getParserHtmlText2Block(
            'commonParser'
          )?.({
            element: node,
            flavour: 'affine:paragraph',
            type: tagName.toLowerCase(),
          });
          break;
        case 'BLOCKQUOTE':
          result = await this._contentParser.getParserHtmlText2Block(
            'blockQuoteParser'
          )?.(node);
          break;
        case 'P':
          if (
            node.firstChild instanceof Text &&
            (node.firstChild.textContent?.startsWith('[] ') ||
              node.firstChild.textContent?.startsWith('[ ] ') ||
              node.firstChild.textContent?.startsWith('[x] '))
          ) {
            result = await this._contentParser.getParserHtmlText2Block(
              'listItemParser'
            )?.(node);
          } else if (node.firstChild instanceof HTMLImageElement) {
            result = await this._contentParser.getParserHtmlText2Block(
              'embedItemParser'
            )?.(node.firstChild);
          } else {
            result = await this._contentParser.getParserHtmlText2Block(
              'commonParser'
            )?.({
              element: node,
              flavour: 'affine:paragraph',
              type: 'text',
            });
          }
          break;
        case 'LI':
          result = await this._contentParser.getParserHtmlText2Block(
            'listItemParser'
          )?.(node);
          break;
        case 'HR':
          result = await this._contentParser.getParserHtmlText2Block(
            'commonParser'
          )?.({
            element: node,
            flavour: 'affine:divider',
          });
          break;
        case 'PRE':
          result = await this._contentParser.getParserHtmlText2Block(
            'codeBlockParser'
          )?.(node);
          break;
        case 'IMG':
          {
            result = await this._contentParser.getParserHtmlText2Block(
              'embedItemParser'
            )?.(node);
          }
          break;
        default:
          break;
      }
    }

    if (result && result.length > 0) {
      return result;
    }

    // If node.childNodes are all inline elements or text nodes, merge them into one paragraph.
    if (node.childNodes.length > 0) {
      const hasNonInlineOrNonLeaf = Array.from(node.childNodes).some(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          return false;
        }

        if (child.nodeType === Node.ELEMENT_NODE) {
          const childElement = child as Element;
          const isInlineElement =
            INLINE_TAGS.includes(childElement.tagName) ||
            (childElement.tagName.includes('-') &&
              checkWebComponentIfInline(childElement));
          return !isInlineElement;
        }

        return true;
      });

      if (!hasNonInlineOrNonLeaf) {
        const allInlineResult = await this._commonHTML2Block(
          node,
          'affine:paragraph',
          'text'
        );
        if (allInlineResult) {
          return [allInlineResult];
        }
      }
    }

    const openBlockPromises = Array.from(node.children).map(
      async childElement => {
        const clipBlockInfos =
          (await this._contentParser.getParserHtmlText2Block('nodeParser')?.(
            childElement
          )) || [];

        if (clipBlockInfos && clipBlockInfos.length) {
          return clipBlockInfos;
        }
        return [];
      }
    );

    const results: Array<OpenBlockInfo[]> = [];
    for (const item of openBlockPromises) {
      results.push(await item);
    }
    return results.flat().filter(v => v);
  };

  private _commonParser = async ({
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
  }): Promise<OpenBlockInfo[] | null> => {
    const res = await this._commonHTML2Block(
      element,
      flavour,
      type,
      checked,
      ignoreEmptyElement
    );
    return res ? [res] : null;
  };

  private async _commonHTML2Block(
    element: Element,
    flavour: string,
    type: string,
    checked?: boolean,
    ignoreEmptyElement = true
  ): Promise<OpenBlockInfo | null> {
    const childNodes = element.childNodes;
    let isChildNode = false;
    const textValues: DeltaOperation[] = [];
    const children = [];
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes.item(i);
      if (!node) continue;
      if (node.nodeName === '#comment') continue;
      if (!isChildNode) {
        if (node instanceof Text) {
          textValues.push(
            ...this._commonHTML2Text(node, {}, ignoreEmptyElement)
          );
          continue;
        }
        const htmlElement = node as HTMLElement;
        if (
          INLINE_TAGS.includes(htmlElement.tagName) ||
          (htmlElement.tagName.includes('-') &&
            checkWebComponentIfInline(htmlElement))
        ) {
          textValues.push(
            ...this._commonHTML2Text(node, {}, ignoreEmptyElement)
          );
          continue;
        }
      }
      if (node instanceof Element) {
        const childNode = await this._nodeParser(node);
        childNode && children.push(...childNode);
      }
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
  ): DeltaOperation[] {
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
    const currentTextStyle = getTextStyle(htmlElement);

    if (!childNodes.length) {
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
          {
            ...textStyle,
            ...currentTextStyle,
          },
          ignoreEmptyText
        );
        result.push(...textBlocks);
        return result;
      }, [] as DeltaOperation[])
      .filter(v => v);
    return childTexts;
  }

  private _listItemParser = async (
    element: Element
  ): Promise<OpenBlockInfo[] | null> => {
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
      flavour: 'affine:list',
      type: type,
      checked: checked,
    });
    return result;
  };

  private _blockQuoteParser = async (
    element: Element
  ): Promise<OpenBlockInfo[] | null> => {
    const getText = (list: OpenBlockInfo[]): OpenBlockInfo['text'] => {
      const result: OpenBlockInfo['text'] = [];
      list.forEach(item => {
        const texts = item.text.filter(textItem => textItem.insert);
        if (result.length > 0 && texts.length > 0) {
          result.push({ insert: '\n' });
        }
        result.push(...texts);

        const childTexts = getText(item.children);
        if (result.length > 0 && childTexts.length > 0) {
          result.push({ insert: '\n' });
        }
        result.push(...childTexts);
      });
      return result;
    };

    const commonResult = await this._contentParser.getParserHtmlText2Block(
      'commonParser'
    )?.({
      element: element,
      flavour: 'affine:paragraph',
      type: 'text',
    });
    if (!commonResult) {
      return null;
    }

    return [
      {
        flavour: 'affine:paragraph',
        type: 'quote',
        text: getText(commonResult),
        children: [],
      },
    ];
  };

  private _codeBlockParser = async (
    element: Element
  ): Promise<OpenBlockInfo[] | null> => {
    // code block doesn't parse other nested Markdown syntax, thus is always one layer deep, example:
    // <pre><code class="language-typescript">code content</code></pre>
    const content = element.firstChild?.textContent || '';
    const language =
      element.children[0]?.getAttribute('class')?.split('-')[1] || 'JavaScript';
    return [
      {
        flavour: 'affine:code',
        text: [
          {
            insert: content,
            attributes: {
              'code-block': true,
            },
          },
        ],
        children: [],
        language,
      },
    ];
  };

  private _embedItemParser = async (
    element: Element
  ): Promise<OpenBlockInfo[] | null> => {
    let result: OpenBlockInfo[] | null = [];
    if (element instanceof HTMLImageElement) {
      const imgUrl = (element as HTMLImageElement).src;
      let resp;
      try {
        resp = await fetch(imgUrl, { mode: 'cors' });
      } catch (error) {
        console.error(error);
        return result;
      }
      const imgBlob = await resp.blob();
      if (!imgBlob.type.startsWith('image/')) {
        return result;
      }
      const storage = await this._editor.page.blobs;
      assertExists(storage);
      const id = await storage.set(imgBlob);
      result = [
        {
          flavour: 'affine:embed',
          type: 'image',
          sourceId: id,
          children: [],
          text: [{ insert: '' }],
        },
      ];
    }

    return result;
  };
}

const getIsLink = (htmlElement: HTMLElement) => {
  return ['A'].includes(htmlElement.tagName);
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
    textStyle['link'] =
      htmlElement.getAttribute('href') || htmlElement.getAttribute('src');
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
    textStyle['code'] = true;
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

const checkWebComponentIfInline = (element: Element) => {
  const style = window.getComputedStyle(element);

  return (
    style.display.includes('inline') ||
    (element as HTMLElement).style.display.includes('inline')
  );
};
