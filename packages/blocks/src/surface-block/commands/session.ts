import type { Command } from '@blocksuite/block-std';

function buildViewportKey(pageId: string) {
  return 'blocksuite:' + pageId + ':edgelessViewport';
}

export type SerializedViewport =
  | {
      centerX: number;
      centerY: number;
      zoom: number;
    }
  | {
      /** The id of the block that the viewport is centered on. */
      referenceId: string;
      xywh: string;
      padding?: [number, number, number, number];
    };

export const saveViewportToSessionCommand: Command<
  'host',
  never,
  {
    viewport: SerializedViewport;
  }
> = (ctx, next) => {
  const pageId = ctx.host?.page.id;
  if (!pageId) return;

  const { viewport } = ctx;
  sessionStorage.setItem(buildViewportKey(pageId), JSON.stringify(viewport));

  return next();
};

export const getViewportFromSessionCommand: Command<
  'host',
  'storedViewport',
  object
> = (ctx, next) => {
  const pageId = ctx.host?.page.id;
  if (!pageId) return;

  const viewportStr = sessionStorage.getItem(buildViewportKey(pageId));
  const storedViewport = viewportStr
    ? (JSON.parse(viewportStr) as SerializedViewport)
    : null;

  return next({ storedViewport });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      storedViewport?: SerializedViewport | null;
    }

    interface Commands {
      saveViewportToSession: typeof saveViewportToSessionCommand;
      getViewportFromSession: typeof getViewportFromSessionCommand;
    }
  }
}
