import type {
  AttachmentBlockModel,
  ImageBlockProps,
} from '@blocksuite/affine-model';

import { withTempBlobData } from '@blocksuite/affine-shared/utils';
import { html, type TemplateResult } from 'lit';

import { transformModel } from '../root-block/utils/operations/model.js';

type EmbedConfig = {
  name: string;
  /**
   * Check if the attachment can be turned into embed view.
   */
  check: (model: AttachmentBlockModel, maxFileSize: number) => boolean;
  /**
   * The action will be executed when the 「Turn into embed view」 button is clicked.
   */
  action?: (model: AttachmentBlockModel) => Promise<void> | void;
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
    name: 'image',
    check: model =>
      model.doc.schema.flavourSchemaMap.has('affine:image') &&
      model.type.startsWith('image/'),
    action: model => turnIntoImageBlock(model),
  },
  {
    name: 'pdf',
    check: (model, maxFileSize) =>
      model.type === 'application/pdf' && model.size <= maxFileSize,
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
    name: 'video',
    check: (model, maxFileSize) =>
      model.type.startsWith('video/') && model.size <= maxFileSize,
    template: (_, blobUrl) =>
      html`<video width="100%;" height="480" controls src=${blobUrl}></video>`,
  },
  {
    name: 'audio',
    check: (model, maxFileSize) =>
      model.type.startsWith('audio/') && model.size <= maxFileSize,
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
  if (!model.doc.schema.flavourSchemaMap.has('affine:image')) {
    console.error('The image flavour is not supported!');
    return;
  }

  const sourceId = model.sourceId;
  if (!sourceId) return;

  const { saveAttachmentData, getImageData } = withTempBlobData();
  saveAttachmentData(sourceId, { name: model.name });

  const imageConvertData = model.sourceId
    ? getImageData(model.sourceId)
    : undefined;

  const imageProp: Partial<ImageBlockProps> = {
    sourceId,
    caption: model.caption,
    size: model.size,
    ...imageConvertData,
  };
  transformModel(model, 'affine:image', imageProp);
}
