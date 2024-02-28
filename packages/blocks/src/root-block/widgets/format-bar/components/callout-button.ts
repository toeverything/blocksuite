import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import { whenHover } from '../../../../_common/components/hover/index.js';
import { textConversionConfigs } from '../../../../_common/configs/text-conversion.js';
import { ArrowDownIcon } from '../../../../_common/icons/index.js';
import { isRootElement } from '../../../../root-block/utils/guard.js';
import { updateBlockElementType } from '../../../../root-block/utils/operations/element/block-level.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

interface CalloutTypePanelProps {
  selectedBlockElements: BlockElement[];
  ref?: RefOrCallback;
}

const calloutTypeConfigs = [
  {
    type: 'info',
  },
  {
    type: 'success',
  },
  {
    type: 'warning',
  },
  {
    type: 'danger',
  },
  {
    type: 'primary',
  },
  {
    type: 'secondary',
  },
];

const updateCalloutType = (
  selectedBlockElements: BlockElement[],
  type?: string
) => {
  if (selectedBlockElements.length === 0) {
    throw new Error('No models to update!');
  }
  if (!selectedBlockElements.every(el => el.flavour === 'affine:callout')) {
    return;
  }

  updateBlockElementType(selectedBlockElements, 'affine:callout', type);
};

const CalloutTypePanel = ({
  selectedBlockElements,
  ref: containerRef,
}: CalloutTypePanelProps) => {
  return html`<div ${ref(containerRef)} class="callout-type-panel">
    ${calloutTypeConfigs.map(
      ({ type }) =>
        html`<icon-button
          width="100%"
          height="32px"
          style="padding-left: 12px; justify-content: flex-start; gap: 8px;"
          text="${type}"
          data-testid="${type}"
          @click="${() => updateCalloutType(selectedBlockElements, type)}"
        >
        </icon-button>`
    )}
  </div>`;
};

export const CalloutButton = (formatBar: AffineFormatBarWidget) => {
  if (formatBar.displayType !== 'text' && formatBar.displayType !== 'block') {
    return null;
  }

  const selectedBlockElements = formatBar.selectedBlockElements;
  // only support model with text
  if (!selectedBlockElements.every(el => el.flavour === 'affine:callout')) {
    return null;
  }

  const paragraphIcon = textConversionConfigs[0].icon;

  const rootElement = formatBar.blockElement;
  if (!isRootElement(rootElement)) {
    throw new Error('paragraph button host is not a page component');
  }

  const { setFloating, setReference } = whenHover(isHover => {
    if (!isHover) {
      const panel = formatBar.shadowRoot?.querySelector<HTMLElement>(
        '.callout-type-panel'
      );
      if (!panel) return;
      panel.style.display = 'none';
      return;
    }
    const formatQuickBarElement = formatBar.formatBarElement;
    const button = formatBar.shadowRoot?.querySelector<HTMLElement>(
      '.callout-type-panel'
    );
    const panel = formatBar.shadowRoot?.querySelector<HTMLElement>(
      '.callout-type-panel'
    );
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
    })
      .then(({ x, y }) => {
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
      })
      .catch(console.error);
  });

  const calloutTypePanel = CalloutTypePanel({
    selectedBlockElements,
    ref: setFloating,
  });

  return html`<div ${ref(setReference)} class="callout-type-button">
    <icon-button class="callout-type-button-icon" width="52px" height="32px">
      ${paragraphIcon} ${ArrowDownIcon}</icon-button
    >
    ${calloutTypePanel}
  </div>`;
};
