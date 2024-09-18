import type {
  EmbedYoutubeBlockUrlData,
  EmbedYoutubeModel,
} from '@blocksuite/affine-model';

import { isAbortError } from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { LinkPreviewer } from '../common/link-previewer.js';
import type { EmbedYoutubeBlockComponent } from './embed-youtube-block.js';

export async function queryEmbedYoutubeData(
  embedYoutubeModel: EmbedYoutubeModel,
  linkPreviewer: LinkPreviewer,
  signal?: AbortSignal
): Promise<Partial<EmbedYoutubeBlockUrlData>> {
  const url = embedYoutubeModel.url;

  const [videoOpenGraphData, videoOEmbedData] = await Promise.all([
    linkPreviewer.query(url, signal),
    queryYoutubeOEmbedData(url, signal),
  ]);

  const youtubeEmbedData: Partial<EmbedYoutubeBlockUrlData> = {
    ...videoOpenGraphData,
    ...videoOEmbedData,
  };

  if (youtubeEmbedData.creatorUrl) {
    const creatorOpenGraphData = await linkPreviewer.query(
      youtubeEmbedData.creatorUrl,
      signal
    );
    youtubeEmbedData.creatorImage = creatorOpenGraphData.image;
  }

  return youtubeEmbedData;
}

export async function queryYoutubeOEmbedData(
  url: string,
  signal?: AbortSignal
): Promise<Partial<EmbedYoutubeBlockUrlData>> {
  let youtubeOEmbedData: Partial<EmbedYoutubeBlockUrlData> = {};

  const oEmbedUrl = `https://youtube.com/oembed?url=${url}&format=json`;

  const oEmbedResponse = await fetch(oEmbedUrl, { signal }).catch(() => null);
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

export async function refreshEmbedYoutubeUrlData(
  embedYoutubeElement: EmbedYoutubeBlockComponent,
  signal?: AbortSignal
): Promise<void> {
  let image = null,
    title = null,
    description = null,
    creator = null,
    creatorUrl = null,
    creatorImage = null;

  try {
    embedYoutubeElement.loading = true;

    const queryUrlData = embedYoutubeElement.service?.queryUrlData;
    assertExists(queryUrlData);

    const youtubeUrlData = await queryUrlData(
      embedYoutubeElement.model,
      signal
    );

    ({
      image = null,
      title = null,
      description = null,
      creator = null,
      creatorUrl = null,
      creatorImage = null,
    } = youtubeUrlData);

    if (signal?.aborted) return;

    embedYoutubeElement.doc.updateBlock(embedYoutubeElement.model, {
      image,
      title,
      description,
      creator,
      creatorUrl,
      creatorImage,
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return;
    throw error;
  } finally {
    embedYoutubeElement.loading = false;
  }
}
