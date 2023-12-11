import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import { ArrowDownIcon } from '../../../../_common/icons/index.js';
import type { Flavour, ParagraphBlockModel } from '../../../../models.js';
import { isPageComponent } from '../../../../page-block/utils/guard.js';
import { updateBlockElementType } from '../../../../page-block/utils/operations/element/block-level.js';
import { whenHover } from '../../../components/hover/index.js';
import { textConversionConfigs } from '../../../configs/text-conversion.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

interface ParagraphPanelProps {
  page: Page;
  selectedBlockElements: BlockElement[];
  ref?: RefOrCallback;
}

const updateParagraphType = (
  selectedBlockElements: BlockElement[],
  flavour: Flavour,
  type?: string
) => {
  if (selectedBlockElements.length === 0) {
    throw new Error('No models to update!');
  }
  const { flavour: defaultFlavour, type: defaultType } =
    textConversionConfigs[0];
  const targetFlavour = selectedBlockElements.every(
    el =>
      el.flavour === flavour && (el.model as ParagraphBlockModel).type === type
  )
    ? defaultFlavour
    : flavour;
  const targetType = selectedBlockElements.every(
    el =>
      el.flavour === flavour && (el.model as ParagraphBlockModel).type === type
  )
    ? defaultType
    : type;
  updateBlockElementType(selectedBlockElements, targetFlavour, targetType);
};

const ParagraphPanel = ({
  page,
  selectedBlockElements,
  ref: containerRef,
}: ParagraphPanelProps) => {
  return html`<div ${ref(containerRef)} class="paragraph-panel">
    ${textConversionConfigs
      .filter(({ flavour }) => flavour !== 'affine:divider')
      .filter(({ flavour }) => page.schema.flavourSchemaMap.has(flavour))
      .map(
        ({ flavour, type, name, icon }) =>
          html`<icon-button
            width="100%"
            height="32px"
            style="padding-left: 12px; justify-content: flex-start; gap: 8px;"
            text="${name}"
            data-testid="${flavour}/${type}"
            @click="${() =>
              updateParagraphType(selectedBlockElements, flavour, type)}"
          >
            ${icon}
          </icon-button>`
      )}
  </div>`;
};

export const ParagraphButton = (formatBar: AffineFormatBarWidget) => {
  if (formatBar.displayType !== 'text' && formatBar.displayType !== 'block') {
    return null;
  }

  const selectedBlockElements = formatBar.selectedBlockElements;
  // only support model with text
  if (selectedBlockElements.some(el => !el.model.text)) {
    return null;
  }

  const paragraphIcon =
    selectedBlockElements.length < 1
      ? textConversionConfigs[0].icon
      : textConversionConfigs.find(
          ({ flavour, type }) =>
            selectedBlockElements[0].flavour === flavour &&
            (selectedBlockElements[0].model as ParagraphBlockModel).type ===
              type
        )?.icon ?? textConversionConfigs[0].icon;

  const pageElement = formatBar.blockElement;
  if (!isPageComponent(pageElement)) {
    throw new Error('paragraph button host is not a page component');
  }

  const { setFloating, setReference } = whenHover(isHover => {
    if (!isHover) {
      const panel = formatBar.shadowRoot?.querySelector(
        '.paragraph-panel'
      ) as HTMLElement | null;
      assertExists(panel);
      panel.style.display = 'none';
      return;
    }
    const formatQuickBarElement = formatBar.formatBarElement;
    const button = formatBar.shadowRoot?.querySelector(
      '.paragraph-button'
    ) as HTMLElement | null;
    const panel = formatBar.shadowRoot?.querySelector(
      '.paragraph-panel'
    ) as HTMLElement | null;
    assertExists(button);
    assertExists(panel);
    assertExists(formatQuickBarElement, 'format quick bar should exist');
    panel.style.display = 'block';
    computePosition(formatQuickBarElement, panel, {
      placement: 'top-start',
      middleware: [
        flip(),
        offset(4),
        shift({
          padding: 6,
        }),
      ],
    }).then(({ x, y }) => {
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
    });
  });

  const paragraphPanel = ParagraphPanel({
    selectedBlockElements,
    page: formatBar.root.page,
    ref: setFloating,
  });

  return html`<div ${ref(setReference)} class="paragraph-button">
    <icon-button class="paragraph-button-icon" width="52px" height="32px">
      ${paragraphIcon} ${ArrowDownIcon}</icon-button
    >
    ${paragraphPanel}
  </div>`;
};
