import { TextSelection } from '@blocksuite/block-std';
import { ArrowDownIcon } from '@blocksuite/global/config';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';
import { computePosition, flip, shift } from '@floating-ui/dom';
import { html } from 'lit';

import { getBlockElementByModel } from '../../../__internal__/utils/query.js';
import type { BlockSchemas } from '../../../models.js';
import { paragraphConfig } from '../../../page-block/const/paragraph-config.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import {
  onModelElementUpdated,
  updateBlockType,
} from '../../../page-block/utils/container-operations.js';
import { isPageComponent } from '../../../page-block/utils/guard.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

interface ParagraphPanelProps {
  pageElement: PageBlockComponent;
  page: Page;
  selectedModels: BaseBlockModel[];
}

interface ParagraphButtonProps {
  pageElement: PageBlockComponent;
  formatBar: AffineFormatBarWidget;
  page: Page;
  selectedModels: BaseBlockModel[];
}

const updateParagraphType = (
  pageElement: PageBlockComponent,
  models: BaseBlockModel[],
  flavour: keyof BlockSchemas,
  type?: string
) => {
  if (models.length === 0) {
    throw new Error('No models to update!');
  }

  const { flavour: defaultFlavour, type: defaultType } = paragraphConfig[0];
  const targetFlavour = models.every(model => model.flavour === flavour)
    ? defaultFlavour
    : flavour;
  const targetType = models.every(model => model.type === type)
    ? defaultType
    : type;
  const newModels = updateBlockType(
    pageElement,
    models,
    targetFlavour,
    targetType
  );

  // Reset selection if the target is code block
  if (targetFlavour === 'affine:code') {
    if (newModels.length !== 1) {
      throw new Error(
        "Failed to reset selection! New model length isn't 1 when convert to code block"
      );
    }
    const codeModel = newModels[0];
    onModelElementUpdated(codeModel, () => {
      const codeElement = getBlockElementByModel(codeModel);
      assertExists(codeElement);
      const selectionManager = codeElement.root.selectionManager;
      selectionManager.set([
        new TextSelection({
          from: {
            path: codeElement.path,
            index: 0,
            length: codeModel.text?.length ?? 0,
          },
          to: null,
        }),
      ]);
    });
  }
};

const ParagraphPanel = ({
  page,
  selectedModels,
  pageElement,
}: ParagraphPanelProps) => {
  return html`<div class="paragraph-panel">
    ${paragraphConfig
      .filter(({ flavour }) => flavour !== 'affine:divider')
      .filter(({ flavour }) => page.schema.flavourSchemaMap.has(flavour))
      .map(
        ({ flavour, type, name, icon }) => html`<icon-button
          width="100%"
          height="32px"
          style="padding-left: 12px; justify-content: flex-start; gap: 8px;"
          text="${name}"
          data-testid="${flavour}/${type}"
          @click="${() =>
            updateParagraphType(pageElement, selectedModels, flavour, type)}"
        >
          ${icon}
        </icon-button>`
      )}
  </div>`;
};

export const ParagraphButton = ({
  formatBar,
  page,
  selectedModels,
}: ParagraphButtonProps) => {
  const paragraphIcon =
    selectedModels.length < 1
      ? paragraphConfig[0].icon
      : paragraphConfig.find(
          ({ flavour, type }) =>
            selectedModels[0].flavour === flavour &&
            selectedModels[0].type === type
        )?.icon ?? paragraphConfig[0].icon;

  const pageElement = formatBar.pageElement;
  if (!isPageComponent(pageElement)) {
    throw new Error('paragraph button host is not a page component');
  }

  const paragraphPanel = ParagraphPanel({
    pageElement,
    selectedModels,
    page,
  });

  const onHover = () => {
    const button = formatBar.querySelector(
      '.paragraph-button'
    ) as HTMLElement | null;
    const panel = formatBar.querySelector(
      '.paragraph-panel'
    ) as HTMLElement | null;
    assertExists(button);
    assertExists(panel);
    panel.style.display = 'block';
    computePosition(button, panel, {
      placement: 'top',
      middleware: [
        flip(),
        shift({
          padding: 6,
        }),
      ],
    }).then(({ x, y }) => {
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
    });
  };
  const onHoverEnd = () => {
    const panel = formatBar.querySelector(
      '.paragraph-panel'
    ) as HTMLElement | null;
    assertExists(panel);
    panel.style.display = 'none';
  };

  return html`<div
    @mouseenter=${onHover}
    @mouseleave=${onHoverEnd}
    class="paragraph-button"
  >
    <icon-button class="paragraph-button-icon" width="52px" height="32px">
      ${paragraphIcon} ${ArrowDownIcon}</icon-button
    >
    ${paragraphPanel}
  </div>`;
};
