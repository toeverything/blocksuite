import { assertExists } from '@blocksuite/global/utils';

import type { EmbedYoutubeBlockComponent } from './embed-youtube-block.js';
import type {
  EmbedYoutubeBlockUrlData,
  EmbedYoutubeModel,
} from './embed-youtube-model.js';

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

export async function queryEmbedYoutubeData(
  embedYoutubeModel: EmbedYoutubeModel
): Promise<Partial<EmbedYoutubeBlockUrlData>> {
  const url = embedYoutubeModel.url;

  const [videoOpenGraphData, videoOEmbedData] = await Promise.all([
    queryEmbedYoutubeOpenGraphData(url),
    queryYoutubeOEmbedData(url),
  ]);

  const youtubeEmbedData: Partial<EmbedYoutubeBlockUrlData> = {
    ...videoOpenGraphData,
    ...videoOEmbedData,
  };

  if (youtubeEmbedData.creatorUrl) {
    const creatorOpenGraphData = await queryEmbedYoutubeOpenGraphData(
      youtubeEmbedData.creatorUrl
    );
    youtubeEmbedData.creatorImage = creatorOpenGraphData.image;
  }

  return youtubeEmbedData;
}

export async function queryYoutubeOEmbedData(
  url: string
): Promise<Partial<EmbedYoutubeBlockUrlData>> {
  let youtubeOEmbedData: Partial<EmbedYoutubeBlockUrlData> = {};

  const oEmbedUrl = `https://youtube.com/oembed?url=${url}&format=json`;

  const oEmbedResponse = await fetch(oEmbedUrl).catch(() => null);
  if (oEmbedResponse && oEmbedResponse.ok) {
    const oEmbedJson = await oEmbedResponse.json();
    const { title, author_name, author_url } = oEmbedJson;

    youtubeOEmbedData = {
      title,
      creator: author_name,
      creatorUrl: author_url,
    };
  }

  return youtubeOEmbedData;
}

export async function queryEmbedYoutubeOpenGraphData(url: string) {
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

export async function refreshEmbedYoutubeUrlData(
  embedYoutubeElement: EmbedYoutubeBlockComponent
) {
  embedYoutubeElement.loading = true;

  const queryUrlData = embedYoutubeElement.service?.queryUrlData;
  assertExists(queryUrlData);
  const youtubeUrlData = await queryUrlData(embedYoutubeElement.model);

  const {
    image = null,
    title = null,
    description = null,
    creator = null,
    creatorUrl = null,
    creatorImage = null,
  } = youtubeUrlData;

  embedYoutubeElement.page.updateBlock(embedYoutubeElement.model, {
    image,
    title,
    description,
    creator,
    creatorUrl,
    creatorImage,
  });

  embedYoutubeElement.loading = false;
}

function getStringFromHTML(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}
