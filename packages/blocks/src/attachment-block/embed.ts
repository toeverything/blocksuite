import { html, type TemplateResult } from 'lit';

import type { AttachmentBlockModel } from './attachment-model.js';
import { turnIntoImage } from './utils.js';

type EmbedConfig = {
  name: string;
  /**
   * Check if the attachment can be turned into embed view.
   */
  check: (model: AttachmentBlockModel) => boolean;
  /**
   * The action will be executed when the 「Turn into embed view」 button is clicked.
   */
  action?: (model: AttachmentBlockModel) => void;
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
      model.page.schema.flavourSchemaMap.has('affine:image') &&
      model.type.startsWith('image/'),
    action: model => turnIntoImage(model),
  },
  {
    name: 'pdf',
    check: model =>
      model.type === 'application/pdf' && model.size <= MAX_EMBED_SIZE,
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
      ></iframe>`;
    },
  },
  {
    name: 'video',
    check: model =>
      model.type.startsWith('video/') && model.size <= MAX_EMBED_SIZE,
    template: (_, blobUrl) =>
      html`<video width="100%;" height="480" controls src=${blobUrl}></video>`,
  },
  {
    name: 'audio',
    check: model =>
      model.type.startsWith('audio/') && model.size <= MAX_EMBED_SIZE,
    template: (_, blobUrl) =>
      html`<audio controls src=${blobUrl} style="margin: 4px;"></audio>`,
  },
];

export function allowEmbed(model: AttachmentBlockModel) {
  return embedConfig.some(config => config.check(model));
}

export function turnIntoEmbedAction(model: AttachmentBlockModel) {
  const config = embedConfig.find(config => config.check(model));
  if (!config || !config.action) {
    model.page.updateBlock<Partial<AttachmentBlockModel>>(model, {
      embed: true,
    });
    return;
  }
  config.action(model);
}

export function renderEmbedView(model: AttachmentBlockModel, blobUrl: string) {
  const config = embedConfig.find(config => config.check(model));
  if (!config || !config.template) {
    console.error('No embed view template found!', model, embedConfig);
    return null;
  }
  return config.template(model, blobUrl);
}
