import { assertExists } from '@blocksuite/global/utils';
import { type TemplateResult, html } from 'lit';

import type { ImageBlockProps } from '../image-block/image-model.js';
import type { AttachmentBlockModel } from './attachment-model.js';

import { withTempBlobData } from '../_common/utils/filesys.js';
import { transformModel } from '../root-block/utils/operations/model.js';

type EmbedConfig = {
  /**
   * The action will be executed when the 「Turn into embed view」 button is clicked.
   */
  action?: (model: AttachmentBlockModel) => Promise<void> | void;
  /**
   * Check if the attachment can be turned into embed view.
   */
  check: (model: AttachmentBlockModel, maxFileSize: number) => boolean;
  name: string;
  /**
   * The template will be used to render the embed view.
   */
  template?: (
    model: AttachmentBlockModel,
    blobUrl: string
  ) => TemplateResult<1>;
};

// 10MB
const MAX_EMBED_SIZE = 10 * 1024 * 1024;

const embedConfig: EmbedConfig[] = [
  {
    action: model => turnIntoImageBlock(model),
    check: model =>
      model.doc.schema.flavourSchemaMap.has('affine:image') &&
      model.type.startsWith('image/'),
    name: 'image',
  },
  {
    check: (model, maxFileSize) =>
      model.type === 'application/pdf' && model.size <= maxFileSize,
    name: 'pdf',
    template: (_, blobUrl) => {
      // More options: https://tinytip.co/tips/html-pdf-params/
      // https://chromium.googlesource.com/chromium/src/+/refs/tags/121.0.6153.1/chrome/browser/resources/pdf/open_pdf_params_parser.ts
      const parameters = '#toolbar=0';
      return html`<iframe
        style="width: 100%; color-scheme: auto;"
        height="480"
        src=${blobUrl + parameters}
        loading="lazy"
        scrolling="no"
        frameborder="no"
        allowTransparency
        allowfullscreen
        type="application/pdf"
      ></iframe>`;
    },
  },
  {
    check: (model, maxFileSize) =>
      model.type.startsWith('video/') && model.size <= maxFileSize,
    name: 'video',
    template: (_, blobUrl) =>
      html`<video width="100%;" height="480" controls src=${blobUrl}></video>`,
  },
  {
    check: (model, maxFileSize) =>
      model.type.startsWith('audio/') && model.size <= maxFileSize,
    name: 'audio',
    template: (_, blobUrl) =>
      html`<audio controls src=${blobUrl} style="margin: 4px;"></audio>`,
  },
];

export function allowEmbed(
  model: AttachmentBlockModel,
  maxFileSize: number = MAX_EMBED_SIZE
) {
  return embedConfig.some(config => config.check(model, maxFileSize));
}

export function convertToEmbed(
  model: AttachmentBlockModel,
  maxFileSize: number = MAX_EMBED_SIZE
) {
  const config = embedConfig.find(config => config.check(model, maxFileSize));
  if (!config || !config.action) {
    model.doc.updateBlock<Partial<AttachmentBlockModel>>(model, {
      embed: true,
    });
    return;
  }
  config.action(model)?.catch(console.error);
}

export function renderEmbedView(
  model: AttachmentBlockModel,
  blobUrl: string,
  maxFileSize: number = MAX_EMBED_SIZE
) {
  const config = embedConfig.find(config => config.check(model, maxFileSize));
  if (!config || !config.template) {
    console.error('No embed view template found!', model, embedConfig);
    return null;
  }
  return config.template(model, blobUrl);
}

/**
 * Turn the attachment block into an image block.
 */
export function turnIntoImageBlock(model: AttachmentBlockModel) {
  if (!model.doc.schema.flavourSchemaMap.has('affine:image'))
    throw new Error('The image flavour is not supported!');

  const sourceId = model.sourceId;
  assertExists(sourceId);

  const { getImageData, saveAttachmentData } = withTempBlobData();
  saveAttachmentData(sourceId, { name: model.name });

  const imageConvertData = model.sourceId
    ? getImageData(model.sourceId)
    : undefined;

  const imageProp: Partial<ImageBlockProps> = {
    caption: model.caption,
    size: model.size,
    sourceId,
    ...imageConvertData,
  };
  transformModel(model, 'affine:image', imageProp);
}
