import { assertExists } from '@blocksuite/global/utils';

import type { EmbedLoomBlockComponent } from './embed-loom-block.js';
import type {
  EmbedLoomBlockUrlData,
  EmbedLoomModel,
} from './embed-loom-model.js';

import { isAbortError } from '../_common/utils/helper.js';

const LoomOEmbedEndpoint = 'https://www.loom.com/v1/oembed';

export async function queryEmbedLoomData(
  embedLoomModel: EmbedLoomModel,
  signal?: AbortSignal
): Promise<Partial<EmbedLoomBlockUrlData>> {
  const url = embedLoomModel.url;

  const loomEmbedData: Partial<EmbedLoomBlockUrlData> =
    await queryLoomOEmbedData(url, signal);

  return loomEmbedData;
}

export async function queryLoomOEmbedData(
  url: string,
  signal?: AbortSignal
): Promise<Partial<EmbedLoomBlockUrlData>> {
  let loomOEmbedData: Partial<EmbedLoomBlockUrlData> = {};

  const oEmbedUrl = `${LoomOEmbedEndpoint}?url=${url}`;

  const oEmbedResponse = await fetch(oEmbedUrl, { signal }).catch(() => null);
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
  embedLoomElement: EmbedLoomBlockComponent,
  signal?: AbortSignal
): Promise<void> {
  let title = null,
    description = null,
    image = null;

  try {
    embedLoomElement.loading = true;

    const queryUrlData = embedLoomElement.service?.queryUrlData;
    assertExists(queryUrlData);

    const loomUrlData = await queryUrlData(embedLoomElement.model);
    ({ title = null, description = null, image = null } = loomUrlData);

    if (signal?.aborted) return;

    embedLoomElement.doc.updateBlock(embedLoomElement.model, {
      title,
      description,
      image,
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return;
  } finally {
    embedLoomElement.loading = false;
  }
}
