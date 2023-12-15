function buildViewportKey(pageId: string) {
  return 'blocksuite:' + pageId + ':edgelessViewport';
}

type SerializedViewport =
  | {
      x: number;
      y: number;
      zoom: number;
    }
  | {
      /**
       * The id of the block that the viewport is centered on.
       */
      referenceId: string;
      padding?: [number, number, number, number];
    };

export function saveViewportToSession(
  pageId: string,
  viewport: SerializedViewport
) {
  sessionStorage.setItem(buildViewportKey(pageId), JSON.stringify(viewport));
}

export function getViewportFromSession(
  pageId: string
): SerializedViewport | null {
  try {
    const storedViewport = sessionStorage.getItem(buildViewportKey(pageId));
    return storedViewport ? JSON.parse(storedViewport) : null;
  } catch {
    return null;
  }
}
