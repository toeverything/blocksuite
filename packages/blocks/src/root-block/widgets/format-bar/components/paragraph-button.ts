import type { ParagraphBlockModel } from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';

import { whenHover } from '@blocksuite/affine-components/hover';
import { ArrowDownIcon } from '@blocksuite/affine-components/icons';
import { assertExists } from '@blocksuite/global/utils';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { html } from 'lit';
import { ref, type RefOrCallback } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

import type { ParagraphActionConfigItem } from '../config.js';
import type { AffineFormatBarWidget } from '../format-bar.js';

import { textConversionConfigs } from '../../../../_common/configs/text-conversion.js';

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
    item => html`
      <editor-menu-action
        data-testid="${item.id}"
        @click="${() => item.action(formatBar.std.command.chain(), formatBar)}"
      >
        ${typeof item.icon === 'function' ? item.icon() : item.icon}
        ${item.name}
      </editor-menu-action>
    `
  );

  return html`
    <editor-menu-content class="paragraph-panel" data-show ${ref(containerRef)}>
      <div data-orientation="vertical">${renderedConfig}</div>
    </editor-menu-content>
  `;
};

export const ParagraphButton = (formatBar: AffineFormatBarWidget) => {
  if (formatBar.displayType !== 'text' && formatBar.displayType !== 'block') {
    return null;
  }

  const selectedBlocks = formatBar.selectedBlocks;
  // only support model with text
  if (selectedBlocks.some(el => !el.model.text)) {
    return null;
  }

  const paragraphIcon =
    selectedBlocks.length < 1
      ? textConversionConfigs[0].icon
      : (textConversionConfigs.find(
          ({ flavour, type }) =>
            selectedBlocks[0].flavour === flavour &&
            (selectedBlocks[0].model as ParagraphBlockModel).type === type
        )?.icon ?? textConversionConfigs[0].icon);

  const rootComponent = formatBar.block;
  if (rootComponent.model.flavour !== 'affine:page') {
    console.error('paragraph button host is not a page component');
    return null;
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
    panel.style.display = 'flex';
    computePosition(formatQuickBarElement, panel, {
      placement: 'top-start',
      middleware: [
        flip(),
        offset(6),
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

  return html`
    <div class="paragraph-button" ${ref(setReference)}>
      <editor-icon-button class="paragraph-button-icon">
        ${paragraphIcon} ${ArrowDownIcon}
      </editor-icon-button>
      ${paragraphPanel}
    </div>
  `;
};
