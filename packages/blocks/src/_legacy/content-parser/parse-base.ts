import { type DeltaOperation, nanoid, type Page } from '@blocksuite/store';
import { lightCssVariables } from '@toeverything/theme';

import { getTagColor } from '../../_common/components/tags/colors.js';
import { getStandardLanguage } from '../../code-block/utils/code-languages.js';
import { FALLBACK_LANG } from '../../code-block/utils/consts.js';
import { columnManager } from '../../database-block/common/columns/manager.js';
import { richTextPureColumnConfig } from '../../database-block/common/columns/rich-text/define.js';
import type {
  BlockSchemas,
  Cell,
  Column,
  SerializedBlock,
} from '../../index.js';
import type { ContentParser, ContextedContentParser } from './index.js';

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
) => Promise<SerializedBlock[] | null>;

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

export abstract class BaseParser {
  protected _contentParser: ContentParser;
  protected _page: Page;
  protected _customFetchFileHandler?: FetchFileHandler;
  protected _customTextStyleHandler?: TextStyleHandler;
  protected _customTableParserHandler?: TableParseHandler;
  protected _customTableTitleColumnHandler?: TableTitleColumnHandler;
  protected abstract _contextedContentParser: ContextedContentParser;
  private _textHighlightColors?: Map<string, string>;

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

  protected _fetchFileHandler = async (
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

  public abstract registerParsers(): void;

  protected _getTextHighlightColors(): Map<string, string> {
    if (!this._textHighlightColors) {
      const highlightPrefix = '--affine-text-highlight-';
      this._textHighlightColors = new Map();
      Object.keys(lightCssVariables).forEach(value => {
        if (value.startsWith(highlightPrefix)) {
          this._textHighlightColors?.set(
            value.substring(highlightPrefix.length),
            `var(${value})`
          );
        }
      });
    }
    return this._textHighlightColors;
  }

  // TODO parse children block
  protected _nodeParser = async (
    node: Element
  ): Promise<SerializedBlock[] | null> => {
    let result;
    // custom parser
    result =
      await this._contextedContentParser.getParserHtmlText2Block(
        'CustomNodeParser'
      )?.(node);
    if (result && result.length > 0) {
      return result;
    }

    const tagName = node.tagName;
    const isInlineOrLeaf =
      node instanceof Text || INLINE_TAGS.includes(tagName);
    if (isInlineOrLeaf && node.textContent?.length) {
      result = await this._contextedContentParser.getParserHtmlText2Block(
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
          result = await this._contextedContentParser.getParserHtmlText2Block(
            'CommonParser'
          )?.({
            element: node,
            flavour: 'affine:paragraph',
            type: tagName.toLowerCase(),
          });
          break;
        case 'BLOCKQUOTE':
          result =
            await this._contextedContentParser.getParserHtmlText2Block(
              'BlockQuoteParser'
            )?.(node);
          break;
        case 'P':
          if (
            this._contextedContentParser.context === 'Markdown' &&
            node.firstChild instanceof Text &&
            (node.firstChild.textContent?.startsWith('[] ') ||
              node.firstChild.textContent?.startsWith('[ ] ') ||
              node.firstChild.textContent?.startsWith('[x] '))
          ) {
            result =
              await this._contextedContentParser.getParserHtmlText2Block(
                'ListItemParser'
              )?.(node);
          } else if (node.firstChild instanceof HTMLImageElement) {
            result = await this._contextedContentParser.getParserHtmlText2Block(
              'EmbedItemParser'
            )?.(node.firstChild);
          } else if (
            node.firstElementChild?.tagName === 'A' ||
            node.firstElementChild?.getAttribute('href')?.endsWith('.csv')
          ) {
            result = await this._contextedContentParser.getParserHtmlText2Block(
              'TableParser'
            )?.(node.firstChild);
          } else {
            result = await this._contextedContentParser.getParserHtmlText2Block(
              'CommonParser'
            )?.({
              element: node,
              flavour: 'affine:paragraph',
              type: 'text',
            });
          }
          break;
        case 'LI':
          result =
            await this._contextedContentParser.getParserHtmlText2Block(
              'ListItemParser'
            )?.(node);
          break;
        case 'HR':
          result = await this._contextedContentParser.getParserHtmlText2Block(
            'CommonParser'
          )?.({
            element: node,
            flavour: 'affine:divider',
          });
          break;
        case 'PRE':
          result =
            await this._contextedContentParser.getParserHtmlText2Block(
              'CodeBlockParser'
            )?.(node);
          break;
        case 'FIGURE':
        case 'IMG':
          {
            result =
              await this._contextedContentParser.getParserHtmlText2Block(
                'EmbedItemParser'
              )?.(node);
          }
          break;
        case 'HEADER':
          result =
            await this._contextedContentParser.getParserHtmlText2Block(
              'HeaderParser'
            )?.(node);
          break;
        case 'TABLE':
          result =
            await this._contextedContentParser.getParserHtmlText2Block(
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
        const allInlineResult =
          await this._contextedContentParser.getParserHtmlText2Block(
            'CommonParser'
          )?.({
            element: node,
            flavour: 'affine:paragraph',
            type: 'text',
          });
        if (allInlineResult) {
          return allInlineResult;
        }
      }
    }

    const openBlockPromises = Array.from(node.children).map(
      async childElement => {
        const clipBlockInfos =
          (await this._contextedContentParser.getParserHtmlText2Block(
            'NodeParser'
          )?.(childElement)) || [];
        return clipBlockInfos;
      }
    );

    const results: Array<SerializedBlock[]> = [];
    for (const item of openBlockPromises) {
      results.push(await item);
    }
    return results.flat().filter(v => v);
  };

  protected async _commonHTML2Block(
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
        const childNode =
          await this._contextedContentParser.getParserHtmlText2Block(
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

  protected _commonHTML2Text(
    element: Element | Node,
    textStyle: {
      [key: string]: unknown;
    } = {},
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
    const currentTextStyle = getTextStyle(
      htmlElement,
      this._getTextHighlightColors()
    );
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

  protected _blockQuoteParser = async (
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

    const commonResult =
      await this._contextedContentParser.getParserHtmlText2Block(
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

  protected _codeBlockParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    // code block doesn't parse other nested Markdown syntax, thus is always one layer deep, example:
    // <pre><code class="language-typescript">code content</code></pre>
    const firstChild = element.children[0];
    const languageTag = firstChild?.getAttribute('class')?.split('-');
    const isNormalMarkdown =
      element.tagName === 'PRE' && firstChild?.tagName === 'CODE';
    const isLanguageSpecifiedMarkdown =
      isNormalMarkdown && languageTag?.[0] === 'language';
    let content = '';
    let language = FALLBACK_LANG;
    if (isLanguageSpecifiedMarkdown) {
      // Remove the last new line character.
      // https://spec.commonmark.org/0.30/#example-119
      content = firstChild.textContent?.replace(/\n$/, '') ?? '';
      language = getStandardLanguage(languageTag?.[1])?.id || FALLBACK_LANG;
    } else if (isNormalMarkdown) {
      // Remove the last new line character.
      // https://spec.commonmark.org/0.30/#example-119
      content = firstChild.textContent?.replace(/\n$/, '') ?? '';
    } else {
      content = element.textContent ?? '';
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

  // TODO parse children block, this is temporary solution
  protected _tableParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    if (this._customTableParserHandler) {
      const result = await this._customTableParserHandler(element);
      if (result && result.length > 0) {
        return result;
      }
    }
    if (element.tagName !== 'TABLE') {
      return [];
    }
    const theadElement = element.querySelector('thead');
    const tbodyElement = element.querySelector('tbody');
    const titleTrEle = theadElement?.querySelector('tr');
    const makeIdCounter = () => {
      let id = 1;
      return {
        next: () => id++,
      };
    };
    const idCounter = makeIdCounter();
    const columnMeta: ColumnMeta[] = getTableColumnMeta(titleTrEle);
    const rows: (string | string[])[][] = getTableRows(
      tbodyElement,
      columnMeta
    );

    let titleIndex = columnMeta.findIndex(meta => meta.type === 'title');
    titleIndex = titleIndex !== -1 ? titleIndex : 0;
    let children: SerializedBlock[] = rows
      .map(row => row[titleIndex] ?? '')
      .map(rawTitle => (Array.isArray(rawTitle) ? rawTitle.join('') : rawTitle))
      .map(title => ({
        flavour: 'affine:paragraph',
        type: 'text',
        text: [
          {
            insert: title,
          },
        ],
        children: [],
      }));
    if (this._customTableTitleColumnHandler) {
      const customTitleColumn =
        await this._customTableTitleColumnHandler(element);
      children = customTitleColumn ?? children;
    }
    const columns: Column[] = getTableColumns(columnMeta, rows, idCounter);
    const databasePropsId = idCounter.next();
    const cells = getTableCells(rows, idCounter, columnMeta, columns);
    return [
      {
        flavour: 'affine:database',
        databaseProps: {
          id: '' + databasePropsId,
          title: 'Database',
          rowIds: Object.keys(cells),
          cells: cells,
          columns: columns,
          views: [
            {
              id: this._page.generateBlockId(),
              name: 'Table View',
              mode: 'table',
              columns: [],
              header:
                titleIndex !== -1
                  ? {
                      titleColumn: columns[titleIndex].id,
                      iconColumn: 'type',
                    }
                  : {},
              filter: {
                type: 'group',
                op: 'and',
                conditions: [],
              },
            },
          ],
        },
        children: children,
      },
    ];
  };

  protected _headerParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    let node = element;
    if (element.getElementsByClassName('page-title').length > 0) {
      node = element.getElementsByClassName('page-title')[0];
    }
    const tagName = node.tagName;
    const result = await this._contextedContentParser.getParserHtmlText2Block(
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
    typesTitle: 'title',
  };

  const className = htmlElement?.classList[0] ?? 'typesText';
  return ColumnClassMap[className] || 'rich-text';
};

const getIsLink = (htmlElement: HTMLElement) => {
  return ['A'].includes(htmlElement.tagName);
};

const getTextStyle = (
  htmlElement: HTMLElement,
  highlightMap: Map<string, string>
) => {
  const tagName = htmlElement.tagName;
  const textStyle: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  } = {};

  const style = (htmlElement.getAttribute('style') || '').split(';').reduce(
    (
      style: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      },
      styleString
    ) => {
      const [key, value] = styleString.split(':');
      if (key && value) {
        style[key] = value;
      }
      return style;
    },
    {}
  );

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
    const highlightClassName = Array.from(htmlElement.classList).find(
      className => className.startsWith('highlight-')
    );
    // highlight-color or highlight-color_background
    const varKeys = (highlightClassName ?? '').split(/[-_]/);
    let colorKey = varKeys.length > 0 ? varKeys[1] : '';
    if (colorKey && colorKey !== 'default') {
      if (colorKey === 'red') {
        colorKey = 'pink';
      } else if (colorKey === 'gray') {
        colorKey = 'grey';
      }
      colorKey = highlightMap.has(colorKey) ? colorKey : 'yellow';
      textStyle['background'] = highlightMap.get(colorKey);
    }
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

const getTableCells = (
  rows: (string | string[])[][],
  idCounter: {
    next: () => number;
  },
  columnMeta: ColumnMeta[],
  columns: Column<Record<string, unknown>>[]
) => {
  const cells: Record<string, Record<string, Cell>> = {};
  let titleIndex = columnMeta.findIndex(meta => meta.type === 'title');
  titleIndex = titleIndex !== -1 ? titleIndex : 0;
  rows.forEach(row => {
    const rowId = '' + idCounter.next();
    cells[rowId] = {};
    row.forEach((value, index) => {
      if (columnMeta[index]?.type === 'multi-select' && Array.isArray(value)) {
        cells[rowId][columns[index].id] = {
          columnId: columns[index].id,
          value: value.map(v => columnMeta[index]?.optionsMap.get(v) || ''),
        };
        return;
      }
      if (columnMeta[index]?.type === 'select' && !Array.isArray(value)) {
        cells[rowId][columns[index].id] = {
          columnId: columns[index].id,
          value: columnMeta[index]?.optionsMap.get(value) || '',
        };
        return;
      }
      cells[rowId][columns[index].id] = {
        columnId: columns[index].id,
        value,
      };
    });
  });
  return cells;
};

const getTableColumns = (
  columnMeta: ColumnMeta[],
  rows: (string | string[])[][],
  idCounter: {
    next: () => number;
  }
): Column<Record<string, unknown>>[] => {
  const columns: Column[] = columnMeta.map((value, index) => {
    if (['select', 'multi-select'].includes(value.type)) {
      const options = rows
        .map(row => row[index])
        .flat()
        .filter((value, index, array) => array.indexOf(value) === index)
        .map(uniqueValue => {
          return {
            id: nanoid('unknown'),
            value: uniqueValue,
            color: getTagColor(),
          };
        });
      options.map(option =>
        columnMeta[index].optionsMap.set(option.value, option.id)
      );
      return columnManager
        .getColumn(value.type)
        .createWithId('' + idCounter.next(), value.title, {
          options,
        });
    }
    return columnManager
      .getColumn(value.type)
      .createWithId('' + idCounter.next(), value.title);
  });
  if (rows.length > 0) {
    let maxLen = rows[0].length;
    for (let i = 1; i < rows.length; i++) {
      maxLen = Math.max(maxLen, rows[i].length);
    }
    const addNum = maxLen - columns.length;
    for (let i = 0; i < addNum; i++) {
      columns.push(
        richTextPureColumnConfig.createWithId('' + idCounter.next(), '')
      );
    }
  }
  return columns;
};

const getTableRows = (
  tbodyElement: HTMLTableSectionElement | null,
  columnMeta: ColumnMeta[]
) => {
  const rows: (string | string[])[][] = [];
  tbodyElement?.querySelectorAll('tr').forEach(ele => {
    const row: (string | string[])[] = [];
    ele.querySelectorAll('td').forEach((ele, index) => {
      const cellContent: string[] = [];
      let textContent = ele.textContent?.trim() ?? '';
      Array.from(ele.children).map(child => {
        if (child.classList.contains('checkbox-on')) {
          textContent = 'on';
        } else {
          cellContent.push(child.textContent || '');
        }
      });
      row.push(
        columnMeta[index]?.type !== 'multi-select' ? textContent : cellContent
      );
    });
    rows.push(row);
  });
  return rows;
};

const getTableColumnMeta = (
  titleTrEle: HTMLTableRowElement | null | undefined
) => {
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
  return columnMeta;
};
