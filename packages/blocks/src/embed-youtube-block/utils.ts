import { assertExists } from '@blocksuite/global/utils';

import type { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import type { EmbedYoutubeBlockComponent } from './embed-youtube-block.js';
import type {
  EmbedYoutubeBlockUrlData,
  EmbedYoutubeModel,
} from './embed-youtube-model.js';

export async function queryEmbedYoutubeData(
  embedYoutubeModel: EmbedYoutubeModel,
  linkPreviewer: LinkPreviewer
): Promise<Partial<EmbedYoutubeBlockUrlData>> {
  const url = embedYoutubeModel.url;

  const [videoOpenGraphData, videoOEmbedData] = await Promise.all([
    linkPreviewer.query(url),
    queryYoutubeOEmbedData(url),
  ]);

  const youtubeEmbedData: Partial<EmbedYoutubeBlockUrlData> = {
    ...videoOpenGraphData,
    ...videoOEmbedData,
  };

  if (youtubeEmbedData.creatorUrl) {
    const creatorOpenGraphData = await linkPreviewer.query(
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

export async function refreshEmbedYoutubeUrlData(
  embedYoutubeElement: EmbedYoutubeBlockComponent
) {
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

    const youtubeUrlData = await queryUrlData(embedYoutubeElement.model);
    ({
      image = null,
      title = null,
      description = null,
      creator = null,
      creatorUrl = null,
      creatorImage = null,
    } = youtubeUrlData);
  } catch (error) {
    console.error(error);
  } finally {
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
}
