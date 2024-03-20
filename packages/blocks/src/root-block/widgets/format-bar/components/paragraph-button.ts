import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

import { whenHover } from '../../../../_common/components/hover/index.js';
import { textConversionConfigs } from '../../../../_common/configs/text-conversion.js';
import { ArrowDownIcon } from '../../../../_common/icons/index.js';
import type { ParagraphBlockModel } from '../../../../paragraph-block/index.js';
import { isRootElement } from '../../../../root-block/utils/guard.js';
import type { ParagraphActionConfigItem } from '../config.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

interface ParagraphPanelProps {
  host: EditorHost;
  formatBar: AffineFormatBarWidget;
  ref?: RefOrCallback;
}

const ParagraphPanel = ({
  formatBar,
  host,
  ref: containerRef,
}: ParagraphPanelProps) => {
  const config = formatBar.configItems
    .filter(
      (item): item is ParagraphActionConfigItem =>
        item.type === 'paragraph-action'
    )
    .filter(({ flavour }) => host.doc.schema.flavourSchemaMap.has(flavour));

  const renderedConfig = repeat(
    config,
    item =>
      html`<icon-button
        width="100%"
        height="32px"
        style="padding-left: 12px; justify-content: flex-start; gap: 8px;"
        text="${item.name}"
        data-testid="${item.id}"
        @click="${() => item.action(formatBar.std.command.chain(), formatBar)}"
      >
        ${typeof item.icon === 'function' ? item.icon() : item.icon}
      </icon-button>`
  );

  return html`<div ${ref(containerRef)} class="paragraph-panel">
    ${renderedConfig}
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

  const rootElement = formatBar.blockElement;
  if (!isRootElement(rootElement)) {
    throw new Error('paragraph button host is not a page component');
  }

  const { setFloating, setReference } = whenHover(isHover => {
    if (!isHover) {
      const panel =
        formatBar.shadowRoot?.querySelector<HTMLElement>('.paragraph-panel');
      if (!panel) return;
      panel.style.display = 'none';
      return;
    }
    const formatQuickBarElement = formatBar.formatBarElement;
    const button =
      formatBar.shadowRoot?.querySelector<HTMLElement>('.paragraph-button');
    const panel =
      formatBar.shadowRoot?.querySelector<HTMLElement>('.paragraph-panel');
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

  const paragraphPanel = ParagraphPanel({
    formatBar,
    host: formatBar.host,
    ref: setFloating,
  });

  return html`<div ${ref(setReference)} class="paragraph-button">
    <icon-button class="paragraph-button-icon" width="52px" height="32px">
      ${paragraphIcon} ${ArrowDownIcon}</icon-button
    >
    ${paragraphPanel}
  </div>`;
};
