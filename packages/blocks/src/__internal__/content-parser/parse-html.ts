import type { BlockSchemas } from '@blocksuite/global/types';
import { assertExists } from '@blocksuite/global/utils';
import type { DeltaOperation, Page } from '@blocksuite/store';

import { getStandardLanguage } from '../../code-block/utils/code-languages.js';
import { FALLBACK_LANG } from '../../code-block/utils/consts.js';
import type { Cell, Column } from '../../index.js';
import type { SerializedBlock } from '../utils/index.js';
import type { ContentParser } from './index.js';

export type FetchFileFunc = (
  fileName: string
) => Promise<Blob | null | undefined>;

export const LINK_PRE = 'Affine-LinkedPage-';

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
  'BDI',
];

export class HtmlParser {
  private _contentParser: ContentParser;
  private _page: Page;
  private _customFetchFileFunc?: FetchFileFunc;

  constructor(
    contentParser: ContentParser,
    page: Page,
    fetchFileFunc?: FetchFileFunc
  ) {
    this._contentParser = contentParser;
    this._page = page;
    this._customFetchFileFunc = fetchFileFunc;
  }

  private _fetchFileFunc = async (
    fileName: string
  ): Promise<Blob | null | undefined> => {
    if (this._customFetchFileFunc) {
      const customBlob = await this._customFetchFileFunc(fileName);
      if (customBlob) {
        return customBlob;
      }
    }

    let resp;
    try {
      resp = await fetch(fileName, {
        cache: 'no-cache',
        mode: 'cors',
        headers: {
          Origin: window.location.origin,
        },
      });
    } catch (error) {
      console.error(error);
      return null;
    }
    const imgBlob = await resp.blob();
    if (!imgBlob.type.startsWith('image/')) {
      return null;
    }
    return imgBlob;
  };

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

    this._contentParser.registerParserHtmlText2Block(
      'tableParser',
      this._tableParser
    );
  }

  // TODO parse children block
  private _nodeParser = async (
    node: Element
  ): Promise<SerializedBlock[] | null> => {
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
        case 'FIGURE':
        case 'IMG':
          {
            result = await this._contentParser.getParserHtmlText2Block(
              'embedItemParser'
            )?.(node);
          }
          break;
        case 'HEADER':
          result = await this._contentParser.getParserHtmlText2Block(
            'commonParser'
          )?.({
            element: node,
            flavour: 'affine:page',
            type: tagName.toLowerCase(),
          });
          break;
        case 'TABLE':
          result = await this._contentParser.getParserHtmlText2Block(
            'tableParser'
          )?.(node);
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
        return clipBlockInfos;
      }
    );

    const results: Array<SerializedBlock[]> = [];
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
  }): Promise<SerializedBlock[] | null> => {
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
  ): Promise<SerializedBlock | null> {
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

    if (textValues.length === 0 && children.length === 1) {
      return {
        flavour: flavour as keyof BlockSchemas,
        type: type,
        checked: checked,
        text: children[0].text,
        children: children[0].children,
      };
    }

    return {
      flavour: flavour as keyof BlockSchemas,
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

    return childNodes
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
  }

  private _listItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
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
    return this._contentParser.getParserHtmlText2Block('commonParser')?.({
      element: element,
      flavour: 'affine:list',
      type: type,
      checked: checked,
    });
  };

  private _blockQuoteParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    const getText = (list: SerializedBlock[]): SerializedBlock['text'] => {
      const result: SerializedBlock['text'] = [];
      list.forEach(item => {
        const texts = item.text?.filter(textItem => textItem.insert) || [];
        if (result.length > 0 && texts.length > 0) {
          result.push({ insert: '\n' });
        }
        result.push(...texts);

        const childTexts = getText(item.children || []) || [];
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
  ): Promise<SerializedBlock[] | null> => {
    // code block doesn't parse other nested Markdown syntax, thus is always one layer deep, example:
    // <pre><code class="language-typescript">code content</code></pre>
    const firstChild = element.children[0];
    const languageTag = firstChild?.getAttribute('class')?.split('-');
    const isNormalMarkdown =
      firstChild.tagName === 'Code' && languageTag?.[0] === 'language';
    let content = '';
    let language = FALLBACK_LANG;
    if (isNormalMarkdown) {
      content = element.firstChild?.textContent || '';
      language = getStandardLanguage(languageTag?.[1])?.id || FALLBACK_LANG;
    } else {
      content = element.textContent || '';
    }
    return [
      {
        flavour: 'affine:code',
        text: [
          {
            insert: content,
          },
        ],
        children: [],
        language,
      },
    ];
  };

  private _embedItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    let result: SerializedBlock[] | null = [];
    let imgElement = null;
    const texts = [];
    if (element.tagName === 'FIGURE') {
      imgElement = element.querySelector('img');
      const figcaptionElement = element.querySelector('figcaption');
      if (figcaptionElement) {
        const captionResult = await this._contentParser.getParserHtmlText2Block(
          'commonParser'
        )?.({
          element: figcaptionElement,
          flavour: 'affine:paragraph',
          type: 'text',
        });
        if (captionResult && captionResult.length > 0) {
          texts.push(...(captionResult[0].text || []));
        }
      }
    } else if (element instanceof HTMLImageElement) {
      imgElement = element;
      texts.push({ insert: '' });
    }
    if (imgElement) {
      const imgUrl = imgElement.getAttribute('src') || '';
      const imgBlob = await this._fetchFileFunc(imgUrl);
      if (!imgBlob) {
        return result;
      }
      const storage = await this._page.blobs;
      assertExists(storage);
      const id = await storage.set(imgBlob);
      result = [
        {
          flavour: 'affine:embed',
          type: 'image',
          sourceId: id,
          children: [],
          text: texts,
        },
      ];
    }

    return result;
  };

  // TODO parse children block, this is temporary solution
  private _tableParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    let result: SerializedBlock[] | null = [];
    if (element.tagName === 'TABLE') {
      const theadElement = element.querySelector('thead');
      const tbodyElement = element.querySelector('tbody');
      const titleTrEle = theadElement?.querySelector('tr');
      let id = 1;
      const titles: string[] = [];
      titleTrEle?.querySelectorAll('th').forEach(ele => {
        titles.push(ele.textContent || '');
      });
      const rows: string[][] = [];
      tbodyElement?.querySelectorAll('tr').forEach(ele => {
        const row: string[] = [];
        ele.querySelectorAll('td').forEach(ele => {
          row.push(ele.textContent || '');
        });
        rows.push(row);
      });
      const columns: Column[] = titles.slice(1).map((value, index) => {
        return {
          name: value,
          type: 'rich-text',
          width: 200,
          hide: false,
          id: '' + id++,
        };
      });
      if (rows.length > 0) {
        for (let i = 0; i < rows[0].length - columns.length; i++) {
          columns.push({
            name: '',
            type: 'rich-text',
            width: 200,
            hide: false,
            id: '' + id++,
          });
        }
      }
      const databasePropsId = id++;
      const cells: Record<string, Record<string, Cell>> = {};
      const children: SerializedBlock[] = [];
      rows.forEach(row => {
        children.push({
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: row[0] }],
          children: [],
        });
        const rowId = '' + id++;
        cells[rowId] = {};
        row.slice(1).forEach((value, index) => {
          cells[rowId][columns[index].id] = {
            columnId: columns[index].id,
            value,
          };
        });
      });

      result = [
        {
          flavour: 'affine:database',
          databaseProps: {
            id: '' + databasePropsId,
            title: 'Database',
            titleColumnName: titles[0],
            titleColumnWidth: 432,
            rowIds: Object.keys(cells),
            cells: cells,
            columns: columns,
          },
          children: children,
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
    const linkUrl =
      htmlElement.getAttribute('href') || htmlElement.getAttribute('src');
    if (linkUrl?.startsWith(LINK_PRE)) {
      textStyle['reference'] = {
        pageId: linkUrl.substring(LINK_PRE.length),
        type: 'LinkedPage',
      };
    } else {
      textStyle['link'] = linkUrl;
    }
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
