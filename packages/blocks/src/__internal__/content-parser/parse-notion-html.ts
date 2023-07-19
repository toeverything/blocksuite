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

export class NotionHtmlParser extends BaseParser {
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
    this._contextedContentParser = contentParser.withContext('NotionHtml');
  }

  override registerParsers() {
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlNodeParser',
      this._notionHtmlNodeParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlCommonParser',
      this._notionHtmlCommonParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlListItemParser',
      this._notionHtmlListItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlBlockQuoteParser',
      this._notionHtmlBlockQuoteParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlCodeBlockParser',
      this._notionHtmlCodeBlockParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlEmbedItemParser',
      this._notionHtmlEmbedItemParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlTableParser',
      this._notionHtmlTableParser
    );
    this._contentParser.registerParserHtmlText2Block(
      'NotionHtmlHeaderParser',
      this._notionHtmlHeaderParser
    );
  }

  private _notionHtmlNodeParser = async (
    node: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._nodeParser(node);
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
      flavour,
      type,
      checked,
      ignoreEmptyElement
    );
    return res ? [res] : null;
  };

  private _notionHtmlListItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    const listItemType = getListItemType(element.parentElement);
    if (
      element.firstElementChild?.tagName === 'DETAIL' ||
      element.firstElementChild?.firstElementChild?.tagName === 'SUMMARY'
    ) {
      const summary =
        await this._contextedContentParser.getParserHtmlText2Block(
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
            await this._contextedContentParser.getParserHtmlText2Block(
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
    return this._contextedContentParser.getParserHtmlText2Block(
      'CommonParser'
    )?.({
      element: element,
      flavour: 'affine:list',
      type: listItemType,
      checked: checked,
    });
  };

  private _notionHtmlBlockQuoteParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._blockQuoteParser(element);
  };

  private _notionHtmlCodeBlockParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._codeBlockParser(element);
  };

  private _notionHtmlEmbedItemParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    const texts = [];
    let imgElement = null;
    let caption = '';
    if (element.tagName === 'FIGURE') {
      imgElement = element.querySelector('img');
      const captionText = await getCaptionText(
        element,
        this._contextedContentParser
      );
      texts.push(...(captionText || []));
      if (captionText) {
        caption = captionText[0].insert || '';
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
    return this._tableParser(element);
  };

  private _notionHtmlHeaderParser = async (
    element: Element
  ): Promise<SerializedBlock[] | null> => {
    return this._headerParser(element);
  };
}

const getCaptionText = async (
  element: Element,
  contextedContentParser: ContextedContentParser
) => {
  const figcaptionElement = element.querySelector('figcaption');
  if (figcaptionElement) {
    const captionResult = await contextedContentParser.getParserHtmlText2Block(
      'CommonParser'
    )?.({
      element: figcaptionElement,
      flavour: 'affine:paragraph',
      type: 'text',
    });
    if (captionResult && captionResult.length > 0) {
      return captionResult[0].text;
    }
  }

  return null;
};

const getListItemType = (element: Element | null) => {
  assertExists(element);
  if (element.tagName === 'OL') {
    return 'numbered';
  }
  if (element.tagName === 'UL') {
    if (element.classList.contains('bulleted-list')) {
      return 'bulleted';
    }
    // no toggle list in blocksuite
    if (element.classList.contains('toggle')) {
      return 'bulleted';
    }
    if (element.classList.contains('to-do-list')) {
      return 'todo';
    }
  }
  return 'bulleted';
};
