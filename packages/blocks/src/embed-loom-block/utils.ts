import { assertExists } from '@blocksuite/global/utils';

import type { EmbedLoomBlockComponent } from './embed-loom-block.js';
import type {
  EmbedLoomBlockUrlData,
  EmbedLoomModel,
} from './embed-loom-model.js';

const LoomOEmbedEndpoint = 'https://www.loom.com/v1/oembed';

export async function queryEmbedLoomData(
  embedLoomModel: EmbedLoomModel
): Promise<Partial<EmbedLoomBlockUrlData>> {
  const url = embedLoomModel.url;

  const loomEmbedData: Partial<EmbedLoomBlockUrlData> =
    await queryLoomOEmbedData(url);

  return loomEmbedData;
}

export async function queryLoomOEmbedData(
  url: string
): Promise<Partial<EmbedLoomBlockUrlData>> {
  let loomOEmbedData: Partial<EmbedLoomBlockUrlData> = {};

  const oEmbedUrl = `${LoomOEmbedEndpoint}?url=${url}`;

  const oEmbedResponse = await fetch(oEmbedUrl).catch(() => null);
  if (oEmbedResponse && oEmbedResponse.ok) {
    const oEmbedJson = await oEmbedResponse.json();
    const { title, description, thumbnail_url: image } = oEmbedJson;

    loomOEmbedData = {
      title,
      description,
      image,
    };
  }

  return loomOEmbedData;
}

export async function refreshEmbedLoomUrlData(
  embedLoomElement: EmbedLoomBlockComponent
) {
  let title = null,
    description = null,
    image = null;

  try {
    embedLoomElement.loading = true;

    const queryUrlData = embedLoomElement.service?.queryUrlData;
    assertExists(queryUrlData);

    const loomUrlData = await queryUrlData(embedLoomElement.model);
    ({ title = null, description = null, image = null } = loomUrlData);
  } catch (error) {
    console.error(error);
  } finally {
    embedLoomElement.doc.updateBlock(embedLoomElement.model, {
      title,
      description,
      image,
    });

    embedLoomElement.loading = false;
  }
}
