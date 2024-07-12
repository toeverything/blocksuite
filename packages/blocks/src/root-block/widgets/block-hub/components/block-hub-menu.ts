import { html } from 'lit';

import {
  BlockHubRoundedRectangleIcon,
  DatabaseTableViewIcon,
  EmbedWebIcon,
  NumberedListIconLarge,
  TextIconLarge,
} from '../../../../_common/icons/index.js';
import {
  BLOCKHUB_FILE_ITEMS,
  BLOCKHUB_LIST_ITEMS,
  BLOCKHUB_TEXT_ITEMS,
} from '../config.js';
import { BlockHubCards } from './block-hub-cards.js';

export type CardListType = 'blank' | 'database' | 'file' | 'list' | 'text';

const shouldDisplayCard = (
  type: CardListType | null,
  expanded: boolean,
  isCardListVisible: boolean,
  visibleCardType: CardListType | null
) => {
  return expanded && isCardListVisible && visibleCardType === type;
};

export function BlockHubMenu(
  expanded: boolean,
  isGrabbing: boolean,
  visibleCardType: CardListType | null,
  isCardListVisible: boolean,
  showTooltip: boolean,
  maxHeight: number
) {
  const menuNum = 5;
  const height = menuNum * 44 + 10;

  const blockHubTextCards = BlockHubCards(
    BLOCKHUB_TEXT_ITEMS,
    'text',
    'Text block',
    maxHeight,
    shouldDisplayCard('text', expanded, isCardListVisible, visibleCardType),
    isGrabbing,
    showTooltip
  );

  const blockHubListCards = BlockHubCards(
    BLOCKHUB_LIST_ITEMS,
    'list',
    'List',
    maxHeight,
    shouldDisplayCard('list', expanded, isCardListVisible, visibleCardType),
    isGrabbing,
    showTooltip
  );

  const blockHubFileCards = BlockHubCards(
    BLOCKHUB_FILE_ITEMS,
    'file',
    'Content & Media',
    maxHeight,
    shouldDisplayCard('file', expanded, isCardListVisible, visibleCardType),
    isGrabbing,
    showTooltip
  );

  return html`
    <div
      class="block-hub-icons-container"
      ?transition=${expanded}
      style="height: ${expanded ? `${height}px` : '0'};"
    >
      <div
        class="block-hub-icon-container ${isGrabbing ? 'grabbing' : 'grab'}"
        selected=${visibleCardType === 'blank' ? 'true' : 'false'}
        type="blank"
        draggable="true"
        affine-flavour="affine:paragraph"
        affine-type="text"
      >
        ${BlockHubRoundedRectangleIcon}
        ${showTooltip
          ? html`<affine-tooltip tip-position="left" .offset=${8}
              >Drag to insert blank line
            </affine-tooltip>`
          : null}
      </div>
      <div
        class="block-hub-icon-container"
        type="text"
        selected=${visibleCardType === 'text' ? 'true' : 'false'}
      >
        ${blockHubTextCards} ${TextIconLarge}
      </div>
      <div
        class="block-hub-icon-container"
        type="list"
        selected=${visibleCardType === 'list' ? 'true' : 'false'}
      >
        ${blockHubListCards} ${NumberedListIconLarge}
      </div>
      <div
        class="block-hub-icon-container"
        type="file"
        selected=${visibleCardType === 'file' ? 'true' : 'false'}
      >
        ${blockHubFileCards} ${EmbedWebIcon}
      </div>
      <div
        class="block-hub-icon-container"
        type="database"
        draggable="true"
        affine-flavour="affine:database"
        selected=${visibleCardType === 'database' ? 'true' : 'false'}
      >
        ${DatabaseTableViewIcon}
        ${showTooltip
          ? html`<affine-tooltip tip-position="left" .offset=${8}>
              Drag to create a database
            </affine-tooltip>`
          : null}
      </div>
      <div class="divider"></div>
    </div>
  `;
}
