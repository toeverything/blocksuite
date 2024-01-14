import { assertExists } from '@blocksuite/global/utils';

import type { EmbedFigmaBlockComponent } from './embed-figma-block.js';
import type {
  EmbedFigmaBlockUrlData,
  EmbedFigmaModel,
} from './embed-figma-model.js';

interface AffineLinkPreviewResponseData {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  images?: string[];
  mediaType?: string;
  contentType?: string;
  charset?: string;
  videos?: string[];
  favicons?: string[];
}

export async function queryEmbedFigmaData(
  embedFigmaModel: EmbedFigmaModel
): Promise<Partial<EmbedFigmaBlockUrlData>> {
  const url = embedFigmaModel.url;

  const figmaEmbedData: Partial<EmbedFigmaBlockUrlData> =
    await queryEmbedFigmaOpenGraphData(url);

  return figmaEmbedData;
}

export async function queryEmbedFigmaOpenGraphData(url: string) {
  const response = await fetch(
    'https://affine-worker.toeverything.workers.dev/api/worker/link-preview',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
      }),
    }
  ).catch(() => null);
  if (!response || !response.ok) return {};
  const data: AffineLinkPreviewResponseData = await response.json();
  return {
    title: data.title ? getStringFromHTML(data.title) : null,
    description: data.description ? getStringFromHTML(data.description) : null,
    icon: data.favicons?.[0],
    image: data.images?.[0],
  };
}

export async function refreshEmbedFigmaUrlData(
  embedFigmaElement: EmbedFigmaBlockComponent
) {
  embedFigmaElement.loading = true;

  const queryUrlData = embedFigmaElement.service?.queryUrlData;
  assertExists(queryUrlData);
  const figmaUrlData = await queryUrlData(embedFigmaElement.model);

  const { title = null, description = null } = figmaUrlData;

  embedFigmaElement.page.updateBlock(embedFigmaElement.model, {
    title,
    description,
  });

  embedFigmaElement.loading = false;
}

function getStringFromHTML(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}
