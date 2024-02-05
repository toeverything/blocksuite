import { css } from 'lit';

export const SYNCED_BLOCK_DEFAULT_WIDTH = 752;
export const SYNCED_BLOCK_DEFAULT_HEIGHT = 455;
export const SYNCED_MIN_WIDTH = 370;
export const SYNCED_MIN_HEIGHT = 80;

export const styles = css`
  affine-synced {
    position: relative;
    display: block;
    left: -24px;
    width: calc(100% + 48px);
  }

  .affine-synced-container {
    border-radius: 8px;
    overflow: hidden;
  }
  .affine-synced-container.page {
    display: block;
    width: 100%;
  }
  .affine-synced-container.edgeless {
    display: block;
    padding: 18px 24px;
    width: 100%;
    height: calc(${SYNCED_BLOCK_DEFAULT_HEIGHT}px + 36px);
  }
  .affine-synced-container.hovered.light,
  affine-synced.with-drag-handle > .affine-attachment-container.light {
    box-shadow: 0px 0px 0px 2px rgba(0, 0, 0, 0.08);
  }
  .affine-synced-container.hovered.dark,
  affine-synced.with-drag-handle > .affine-attachment-container.dark {
    box-shadow: 0px 0px 0px 2px rgba(255, 255, 255, 0.14);
  }
  .affine-synced-container.editing.light {
    box-shadow:
      0px 0px 0px 2px rgba(0, 0, 0, 0.08),
      0px 0px 0px 1px var(--affine-brand-color);
  }
  .affine-synced-container.editing.dark {
    box-shadow:
      0px 0px 0px 2px rgba(255, 255, 255, 0.14),
      0px 0px 0px 1px var(--affine-brand-color);
  }

  .synced-block-editor-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .synced-block-editor.affine-doc-viewport,
  .synced-block-editor.affine-edgeless-viewport {
    background: transparent;
  }

  .synced-block-editor .affine-doc-page-block-container {
    padding-left: 24px;
    padding-right: 24px;
    width: 100%;
  }
`;
