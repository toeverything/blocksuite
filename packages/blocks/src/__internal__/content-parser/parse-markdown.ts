import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import type { SerializedBlock } from '../utils/index.js';
import type { ContentParser, ContextedContentParser } from './index.js';
import {
  BaseParser,
  type FetchFileHandler,
  type TableParseHandler,
  type TableTitleColumnHandler,
  type TextStyleHandler,
} from './parse-base.js';

export class MarkdownParser extends BaseParser {
  protected _contextedContentParser: ContextedContentParser;
  constructor(
    contentParser: ContentParser,
    page: Page,
    fetchFileHandler?: FetchFileHandler,
    textStyleHandler?: TextStyleHandler,
    tableParserHandler?: TableParseHandler,
    tableTitleColumnHandler?: TableTitleColumnHandler
  ) {
    super(
      contentParser,
      page,
      fetchFileHandler,
      textStyleHandler,
      tableParserHandler,
      tableTitleColumnHandler
    );
    this._contextedContentParser = contentParser.withContext('Markdown');
  }
  override registerParsers() {
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownNodeParser',
      this._markdownNodeParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownCommonParser',
      this._markdownCommonParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownListItemParser',
      this._markdownListItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownBlockQuoteParser',
      this._markdownBlockQuoteParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownCodeBlockParser',
      this._markdownCodeBlockParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownEmbedItemParser',
      this._markdownEmbedItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownTableParser',
      this._markdownTableParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'MarkdownHeaderParser',
      this._markdownHeaderParser
    );
  }

  private _markdownNodeParser = async (
    node: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._nodeParser(node);
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
      flavour,
      type,
      checked,
      ignoreEmptyElement
    );
    return res ? [res] : null;
  };

  private _markdownListItemParser = async (
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
    return this._contextedContentParser.getParserHtmlText2Block(
      'CommonParser'
    )?.({
      element: element,
      flavour: 'affine:list',
      type: type,
      checked: checked,
    });
  };

  private _markdownBlockQuoteParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._blockQuoteParser(element);
  };

  private _markdownCodeBlockParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._codeBlockParser(element);
  };

  private _markdownEmbedItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    const texts = [];
    texts.push({ insert: '' });
    if (element instanceof HTMLImageElement) {
      // TODO: use the real bookmark instead.
      const imgUrl = element.getAttribute('src') || '';
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

  private _markdownTableParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._tableParser(element);
  };

  private _markdownHeaderParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._headerParser(element);
  };
}
