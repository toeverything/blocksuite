import type { BlockSchemas } from '@blocksuite/global/types';
import { assertExists } from '@blocksuite/global/utils';
import { type DeltaOperation, nanoid, type Page } from '@blocksuite/store';

import { getStandardLanguage } from '../../code-block/utils/code-languages.js';
import { FALLBACK_LANG } from '../../code-block/utils/consts.js';
import { getTagColor } from '../../components/tags/colors.js';
import {
  columnManager,
  richTextHelper,
} from '../../database-block/common/column-manager.js';
import type { Cell, Column } from '../../index.js';
import type { SerializedBlock } from '../utils/index.js';
import type { ContentParser, ParseContext } from './index.js';

export type FetchFileHandler = (
  fileName: string
) => Promise<Blob | null | undefined>;

export type TextStyleHandler = (
  element: HTMLElement,
  styles: Record<string, unknown>
) => void;

export type TableParseHandler = (
  element: Element
) => Promise<SerializedBlock[] | null>;

export type ColumnMeta = {
  type: string;
  title: string;
  optionsMap: Map<string, string>;
};
export type TableTitleColumnHandler = (
  element: Element
) => Promise<string[] | null>;

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
  'TIME',
];

export class HtmlParser {
  private _contentParser: ContentParser;
  private _page: Page;
  private _customFetchFileHandler?: FetchFileHandler;
  private _customTextStyleHandler?: TextStyleHandler;
  private _customTableParserHandler?: TableParseHandler;
  private _customTableTitleColumnHandler?: TableTitleColumnHandler;

  constructor(
    contentParser: ContentParser,
    page: Page,
    fetchFileHandler?: FetchFileHandler,
    textStyleHandler?: TextStyleHandler,
    tableParserHandler?: TableParseHandler,
    tableTitleColumnHandler?: TableTitleColumnHandler
  ) {
    this._contentParser = contentParser;
    this._page = page;
    this._customFetchFileHandler = fetchFileHandler;
    this._customTextStyleHandler = textStyleHandler;
    this._customTableParserHandler = tableParserHandler;
    this._customTableTitleColumnHandler = tableTitleColumnHandler;
  }

  private _fetchFileHandler = async (
    fileName: string
  ): Promise<Blob | null | undefined> => {
    if (this._customFetchFileHandler) {
      const customBlob = await this._customFetchFileHandler(fileName);
      if (customBlob && customBlob.size > 0) {
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
      'MarkdownNodeParser',
      this._markdownNodeParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlNodeParser',
      this._notionHtmlNodeParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownCommonParser',
      this._markdownCommonParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlCommonParser',
      this._notionHtmlCommonParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownListItemParser',
      this._markdownListItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlListItemParser',
      this._notionHtmlListItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownBlockQuoteParser',
      this._markdownBlockQuoteParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlBlockQuoteParser',
      this._notionHtmlBlockQuoteParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownCodeBlockParser',
      this._codeBlockParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlCodeBlockParser',
      this._codeBlockParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownEmbedItemParser',
      this._markdownEmbedItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlEmbedItemParser',
      this._notionHtmlEmbedItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownTableParser',
      this._markdownTableParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlTableParser',
      this._notionHtmlTableParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownHeaderParser',
      this._markdownHeaderParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlHeaderParser',
      this._notionHtmlHeaderParser
    );
  }

  private _notionHtmlNodeParser = async (
    node: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._nodeParser(node, 'NotionHtml');
  };

  private _markdownNodeParser = async (
    node: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._nodeParser(node, 'Markdown');
  };

  // TODO parse children block
  private _nodeParser = async (
    node: Element,
    context: ParseContext
  ): Promise<SerializedBlock[] | null> => {
    const contextedContentParser = this._contentParser.withContext(context);
    let result;
    // custom parser
    result = await contextedContentParser.getParserHtmlText2Block(
      'CustomNodeParser'
    )?.(node);
    if (result && result.length > 0) {
      return result;
    }

    const tagName = node.tagName;
    const isInlineOrLeaf =
      node instanceof Text || INLINE_TAGS.includes(tagName);
    if (isInlineOrLeaf && node.textContent?.length) {
      result = await contextedContentParser.getParserHtmlText2Block(
        'CommonParser'
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
          result = await contextedContentParser.getParserHtmlText2Block(
            'CommonParser'
          )?.({
            element: node,
            flavour: 'affine:paragraph',
            type: tagName.toLowerCase(),
          });
          break;
        case 'BLOCKQUOTE':
          result = await contextedContentParser.getParserHtmlText2Block(
            'BlockQuoteParser'
          )?.(node);
          break;
        case 'P':
          if (
            node.firstChild instanceof Text &&
            (node.firstChild.textContent?.startsWith('[] ') ||
              node.firstChild.textContent?.startsWith('[ ] ') ||
              node.firstChild.textContent?.startsWith('[x] '))
          ) {
            result = await contextedContentParser.getParserHtmlText2Block(
              'ListItemParser'
            )?.(node);
          } else if (node.firstChild instanceof HTMLImageElement) {
            result = await contextedContentParser.getParserHtmlText2Block(
              'EmbedItemParser'
            )?.(node.firstChild);
          } else if (
            node.firstElementChild?.tagName === 'A' ||
            node.firstElementChild?.getAttribute('href')?.endsWith('.csv')
          ) {
            result = await contextedContentParser.getParserHtmlText2Block(
              'TableParser'
            )?.(node.firstChild);
          } else {
            result = await contextedContentParser.getParserHtmlText2Block(
              'CommonParser'
            )?.({
              element: node,
              flavour: 'affine:paragraph',
              type: 'text',
            });
          }
          break;
        case 'LI':
          result = await contextedContentParser.getParserHtmlText2Block(
            'ListItemParser'
          )?.(node);
          break;
        case 'HR':
          result = await contextedContentParser.getParserHtmlText2Block(
            'CommonParser'
          )?.({
            element: node,
            flavour: 'affine:divider',
          });
          break;
        case 'PRE':
          result = await contextedContentParser.getParserHtmlText2Block(
            'CodeBlockParser'
          )?.(node);
          break;
        case 'FIGURE':
        case 'IMG':
          {
            result = await contextedContentParser.getParserHtmlText2Block(
              'EmbedItemParser'
            )?.(node);
          }
          break;
        case 'HEADER':
          result = await contextedContentParser.getParserHtmlText2Block(
            'HeaderParser'
          )?.(node);
          break;
        case 'TABLE':
          result = await contextedContentParser.getParserHtmlText2Block(
            'TableParser'
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
          context,
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
          (await contextedContentParser.getParserHtmlText2Block('NodeParser')?.(
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

  private _notionHtmlCommonParser = async ({
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
      'NotionHtml',
      flavour,
      type,
      checked,
      ignoreEmptyElement
    );
    return res ? [res] : null;
  };

  private _markdownCommonParser = async ({
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
      'Markdown',
      flavour,
      type,
      checked,
      ignoreEmptyElement
    );
    return res ? [res] : null;
  };

  private async _commonHTML2Block(
    element: Element,
    context: ParseContext,
    flavour: string,
    type: string,
    checked?: boolean,
    ignoreEmptyElement = true
  ): Promise<SerializedBlock | null> {
    const contextedContentParser = this._contentParser.withContext(context);
    const childNodes = element.childNodes;
    let isChildNode = false;
    const textValues: DeltaOperation[] = [];
    const children = [];
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes.item(i);
      if (!node) continue;
      if (node.nodeName === '#comment') continue;
      if (node.nodeName === 'STYLE') continue;
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
        const childNode = await contextedContentParser.getParserHtmlText2Block(
          'NodeParser'
        )?.(node);
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

    if (
      textValues.length === 0 &&
      children.length > 0 &&
      flavour === 'affine:list'
    ) {
      return {
        flavour: flavour as keyof BlockSchemas,
        type: type,
        checked: checked,
        text: children[0].text,
        children: children.slice(1),
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
      let isLinkPage = false;
      if (textStyle.reference) {
        isLinkPage =
          (textStyle.reference as Record<string, unknown>).type ===
          'LinkedPage';
      }
      return (element.textContent || '').split('\n').map(text => {
        return {
          insert: isLinkPage ? ' ' : text,
          attributes: textStyle,
        };
      });
    }
    const htmlElement = element as HTMLElement;
    if (htmlElement.classList.contains('katex-mathml')) {
      return [];
    }
    const childNodes = Array.from(htmlElement.childNodes);
    const currentTextStyle = getTextStyle(htmlElement);
    this._customTextStyleHandler &&
      this._customTextStyleHandler(htmlElement, currentTextStyle);

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

  private _notionHtmlListItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    const getListItemType = (element: Element | null) => {
      assertExists(element);
      if (element.tagName === 'OL') {
        return 'numbered';
      }
      if (element.tagName === 'UL') {
        if (element.classList.contains('toggle')) {
          return 'toggle';
        }
        if (element.classList.contains('to-do-list')) {
          return 'todo';
        }
        if (element.classList.contains('bulleted-list')) {
          return 'bulleted';
        }
      }
      return 'bulleted';
    };

    const contextedContentParser =
      this._contentParser.withContext('NotionHtml');
    const listItemType = getListItemType(element.parentElement);
    if (
      element.firstElementChild?.tagName === 'DETAIL' ||
      element.firstElementChild?.firstElementChild?.tagName === 'SUMMARY'
    ) {
      const summary = await contextedContentParser.getParserHtmlText2Block(
        'CommonParser'
      )?.({
        element: element.firstElementChild.firstElementChild,
        flavour: 'affine:list',
        type: listItemType,
      });
      const childNodes = element.firstElementChild.childNodes;
      const children = [];
      for (let i = 1; i < childNodes.length; i++) {
        const node = childNodes.item(i);
        if (!node) continue;
        if (node instanceof Element) {
          const childNode =
            await contextedContentParser.getParserHtmlText2Block(
              'NodeParser'
            )?.(node);
          childNode && children.push(...childNode);
        }
      }
      if (summary && summary.length > 0) {
        summary[0].children = [...(summary[0].children || []), ...children];
      }
      return summary;
    }
    let checked;
    let checkBoxEl;
    if (
      (checkBoxEl = element.firstElementChild)?.classList.contains(
        'checkbox'
      ) ||
      (checkBoxEl =
        element.firstElementChild?.firstElementChild)?.classList.contains(
        'checkbox'
      )
    ) {
      checked = checkBoxEl?.classList.contains('checkbox-on') ?? false;
    }
    return contextedContentParser.getParserHtmlText2Block('CommonParser')?.({
      element: element,
      flavour: 'affine:list',
      type: listItemType,
      checked: checked,
    });
  };

  private _markdownListItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    const tagName = element.parentElement?.tagName;
    let type = tagName === 'OL' ? 'numbered' : 'bulleted';
    const contextedContentParser = this._contentParser.withContext('Markdown');
    if (element.parentElement?.classList?.contains('toggle')) {
      type = 'toggle';
    }
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
    let checkBoxEl;
    if (
      (checkBoxEl = element.firstElementChild)?.classList.contains(
        'checkbox'
      ) ||
      (checkBoxEl =
        element.firstElementChild?.firstElementChild)?.classList.contains(
        'checkbox'
      )
    ) {
      type = 'todo';
      checked = checkBoxEl?.classList.contains('checked') ?? false;
    }
    return contextedContentParser.getParserHtmlText2Block('CommonParser')?.({
      element: element,
      flavour: 'affine:list',
      type: type,
      checked: checked,
    });
  };

  private _notionHtmlBlockQuoteParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._blockQuoteParser(element, 'NotionHtml');
  };

  private _markdownBlockQuoteParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._blockQuoteParser(element, 'Markdown');
  };

  private _blockQuoteParser = async (
    element: Element,
    context: ParseContext
  ): Promise<SerializedBlock[] | null> => {
    const contextedContentParser = this._contentParser.withContext(context);
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

    const commonResult = await contextedContentParser.getParserHtmlText2Block(
      'CommonParser'
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

  private _notionHtmlEmbedItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._embedItemParser(element, 'NotionHtml');
  };

  private _markdownEmbedItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._embedItemParser(element, 'Markdown');
  };

  private _embedItemParser = async (
    element: Element,
    context: ParseContext
  ): Promise<SerializedBlock[] | null> => {
    const contextedContentParser = this._contentParser.withContext(context);
    let imgElement = null;
    const texts = [];
    if (element.tagName === 'FIGURE') {
      imgElement = element.querySelector('img');
      const figcaptionElement = element.querySelector('figcaption');
      if (figcaptionElement) {
        const captionResult =
          await contextedContentParser.getParserHtmlText2Block(
            'CommonParser'
          )?.({
            element: figcaptionElement,
            flavour: 'affine:paragraph',
            type: 'text',
          });
        if (captionResult && captionResult.length > 0) {
          texts.push(...(captionResult[0].text || []));
        }
      }
      const bookmarkUrlElement = element.querySelector('.bookmark.source');
      if (bookmarkUrlElement) {
        const bookmarkUrl = bookmarkUrlElement?.getAttribute('href') ?? '';
        return [
          {
            flavour: 'affine:bookmark',
            children: [],
            url: bookmarkUrl,
          },
        ];
      }
    } else if (element instanceof HTMLImageElement) {
      imgElement = element;
      texts.push({ insert: '' });
    }
    let caption = '';
    if (imgElement) {
      // TODO: use the real bookmark instead.
      if (imgElement.classList.contains('bookmark-icon')) {
        const linkElement = element.querySelector('a');
        if (linkElement) {
          caption = linkElement.getAttribute('href') || '';
        }
        imgElement = element.querySelector('.bookmark-image');
      }
      const imgUrl = imgElement?.getAttribute('src') || '';
      const imgBlob = await this._fetchFileHandler(imgUrl);
      if (!imgBlob || imgBlob.size === 0) {
        const texts = [
          {
            insert: imgUrl,
            attributes: {
              link: imgUrl,
            },
          },
        ];
        return [
          {
            flavour: 'affine:paragraph',
            type: 'text',
            children: [],
            text: texts,
          },
        ];
      } else {
        const storage = this._page.blobs;
        assertExists(storage);
        const id = await storage.set(imgBlob);
        return [
          {
            flavour: 'affine:image',
            sourceId: id,
            children: [],
            text: texts,
            caption,
          },
        ];
      }
    }

    return [
      {
        flavour: 'affine:paragraph',
        type: 'text',
        children: [],
        text: texts,
      },
    ];
  };

  private _notionHtmlTableParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._tableParser(element, 'NotionHtml');
  };

  private _markdownTableParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._tableParser(element, 'Markdown');
  };

  // TODO parse children block, this is temporary solution
  private _tableParser = async (
    element: Element,
    _context: ParseContext
  ): Promise<SerializedBlock[] | null> => {
    let result: SerializedBlock[] | null = [];
    if (this._customTableParserHandler) {
      result = await this._customTableParserHandler(element);
      if (result && result.length > 0) {
        return result;
      }
    }
    if (element.tagName === 'TABLE') {
      const theadElement = element.querySelector('thead');
      const tbodyElement = element.querySelector('tbody');
      const titleTrEle = theadElement?.querySelector('tr');
      let id = 1;
      const columnMeta: ColumnMeta[] = [];
      titleTrEle?.querySelectorAll('th').forEach(ele => {
        columnMeta.push({
          title: ele.textContent?.trim() || '',
          type: getCorrespondingTableColumnType(
            ele.querySelector('svg') ?? undefined
          ),
          optionsMap: new Map<string, string>(),
        });
      });
      const rows: (string | string[])[][] = [];
      tbodyElement?.querySelectorAll('tr').forEach(ele => {
        const row: (string | string[])[] = [];
        ele.querySelectorAll('td').forEach((ele, index) => {
          const cellContent: string[] = [];
          if (ele.children.length === 0) {
            cellContent.push(ele.textContent || '');
          }
          Array.from(ele.children).map(child => {
            if (child.classList.contains('checkbox-on')) {
              cellContent.push('on');
            } else {
              cellContent.push(child.textContent || '');
            }
          });
          row.push(
            columnMeta[index]?.type !== 'multi-select'
              ? cellContent.join('')
              : cellContent
          );
        });
        rows.push(row);
      });
      if (this._customTableTitleColumnHandler) {
        const titleColumn = await this._customTableTitleColumnHandler(element);
        if (titleColumn) {
          for (let i = 1; i < rows.length; i++) {
            const originalContent = rows[i].shift();
            rows[i].unshift(titleColumn[i] || originalContent || '');
          }
        }
      }
      const columns: Column[] = columnMeta.slice(1).map((value, index) => {
        if (['select', 'multi-select'].includes(value.type)) {
          const options = rows
            .map(row => row[index + 1])
            .flat()
            .filter((value, index, array) => array.indexOf(value) === index)
            .map(uniqueValue => {
              return {
                id: nanoid(),
                value: uniqueValue,
                color: getTagColor(),
              };
            });
          options.map(option =>
            columnMeta[index + 1].optionsMap.set(option.value, option.id)
          );
          return columnManager
            .getColumn(value.type)
            .createWithId('' + id++, value.title, {
              options,
            });
        }
        return columnManager
          .getColumn(value.type)
          .createWithId('' + id++, value.title);
      });
      if (rows.length > 0) {
        let maxLen = rows[0].length;
        for (let i = 1; i < rows.length; i++) {
          maxLen = Math.max(maxLen, rows[i].length);
        }
        const addNum = maxLen - columns.length;
        for (let i = 0; i < addNum; i++) {
          columns.push(richTextHelper.createWithId('' + id++, ''));
        }
      }
      const databasePropsId = id++;
      const cells: Record<string, Record<string, Cell>> = {};
      const children: SerializedBlock[] = [];
      rows.forEach(row => {
        children.push({
          flavour: 'affine:paragraph',
          type: 'text',
          text: [{ insert: Array.isArray(row[0]) ? row[0].join('') : row[0] }],
          children: [],
        });
        const rowId = '' + id++;
        cells[rowId] = {};
        row.slice(1).forEach((value, index) => {
          if (
            columnMeta[index + 1]?.type === 'multi-select' &&
            Array.isArray(value)
          ) {
            cells[rowId][columns[index].id] = {
              columnId: columns[index].id,
              value: value.map(
                v => columnMeta[index + 1]?.optionsMap.get(v) || ''
              ),
            };
            return;
          }
          if (
            columnMeta[index + 1]?.type === 'select' &&
            !Array.isArray(value)
          ) {
            cells[rowId][columns[index].id] = {
              columnId: columns[index].id,
              value: columnMeta[index + 1]?.optionsMap.get(value) || '',
            };
            return;
          }
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
            titleColumnName: columnMeta[0]?.title,
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

  private _notionHtmlHeaderParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._headerParser(element, 'NotionHtml');
  };

  private _markdownHeaderParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._headerParser(element, 'Markdown');
  };

  private _headerParser = async (
    element: Element,
    context: ParseContext
  ): Promise<SerializedBlock[] | null> => {
    const contextedContentParser = this._contentParser.withContext(context);
    let node = element;
    if (element.getElementsByClassName('page-title').length > 0) {
      node = element.getElementsByClassName('page-title')[0];
    }

    const tagName = node.tagName;
    const result = await contextedContentParser.getParserHtmlText2Block(
      'CommonParser'
    )?.({
      element: node,
      flavour: 'affine:page',
      type: tagName.toLowerCase(),
    });
    return result;
  };
}

interface ColumnClassMap {
  [key: string]: string;
}

const getCorrespondingTableColumnType = (htmlElement?: SVGSVGElement) => {
  const ColumnClassMap: ColumnClassMap = {
    typesSelect: 'select',
    typesMultipleSelect: 'multi-select',
    typesNumber: 'number',
    typesCheckbox: 'checkbox',
    typesText: 'rich-text',
  };

  const className = htmlElement?.classList[0] ?? 'typesText';
  return ColumnClassMap[className] || 'rich-text';
};

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
    textStyle['link'] = linkUrl;
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
