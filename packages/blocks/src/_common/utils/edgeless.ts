import { storage } from './storage.js';

type ViewportData =
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

const suffix = 'edgelessViewport';

export function saveViewportToSession(pageId: string, viewport: ViewportData) {
  storage.set(pageId, JSON.stringify(viewport), suffix);
}

export function getViewportFromSession(pageId: string): ViewportData | null {
  try {
    const storedViewport = storage.get(pageId, suffix);
    return storedViewport ? JSON.parse(storedViewport) : null;
  } catch {
    return null;
  }
}
