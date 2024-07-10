import { css } from 'lit';

import { PANEL_BASE_COLORS } from '../../../_common/styles.js';

export const styles = css`
  :host {
    position: absolute;
    top: 0;
    right: 0;
    z-index: var(--affine-z-index-popover);
  }

  .affine-image-toolbar-container {
    height: 24px;
    gap: 4px;
    padding: 4px;
    margin: 0;
  }

  .image-toolbar-button {
    ${PANEL_BASE_COLORS}
    border-radius: 4px;
  }
`;
