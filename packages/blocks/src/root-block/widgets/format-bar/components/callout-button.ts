import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';

import { whenHover } from '../../../../_common/components/hover/index.js';
import { ArrowDownIcon } from '../../../../_common/icons/index.js';
import type { CalloutBlockComponent } from '../../../../index.js';
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

// funtion to get the most selected callout block element's type
// If there are no type which is the most selected, return the first type
const getMostSelectedType = (selectedBlockElements: BlockElement[]) => {
  const typeMap = new Map<string, number>();
  selectedBlockElements.forEach(el => {
    if (el.flavour !== 'affine:callout') return;
    const type = (el as CalloutBlockComponent).model.type;
    typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
  });
  const maxType = [...typeMap.entries()].reduce((a, e) =>
    e[1] > a[1] ? e : a
  );
  return maxType[0];
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
          text="${type.charAt(0).toUpperCase() + type.slice(1)}"
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

  // TODO: button style
  const mostSelectedType = getMostSelectedType(selectedBlockElements);
  return html`<div ${ref(setReference)} class="callout-type-button">
    <icon-button class="callout-type-button-icon" width="120px" height="28px">
      <span class="callout-type-button-label">${mostSelectedType}</span>
      ${ArrowDownIcon}</icon-button
    >
    ${calloutTypePanel}
  </div>`;
};
