import {
  type AttachmentBlockModel,
  type ImageBlockProps,
  MAX_IMAGE_WIDTH,
} from '@blocksuite/affine-model';
import { FileSizeLimitService } from '@blocksuite/affine-shared/services';
import {
  readImageSize,
  transformModel,
  withTempBlobData,
} from '@blocksuite/affine-shared/utils';
import type { Container } from '@blocksuite/global/di';
import { createIdentifier } from '@blocksuite/global/di';
import { Bound } from '@blocksuite/global/gfx';
import { type BlockStdScope, StdIdentifier } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { Extension } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { html } from 'lit';

import { getAttachmentBlob } from './utils';

export type AttachmentEmbedConfig = {
  name: string;
  /**
   * Check if the attachment can be turned into embed view.
   */
  check: (model: AttachmentBlockModel, maxFileSize: number) => boolean;
  /**
   * The action will be executed when the 「Turn into embed view」 button is clicked.
   */
  action?: (
    model: AttachmentBlockModel,
    std: BlockStdScope
  ) => Promise<void> | void;
  /**
   * The template will be used to render the embed view.
   */
  template?: (model: AttachmentBlockModel, blobUrl: string) => TemplateResult;
};

// Single embed config.
export const AttachmentEmbedConfigIdentifier =
  createIdentifier<AttachmentEmbedConfig>(
    'AffineAttachmentEmbedConfigIdentifier'
  );

export function AttachmentEmbedConfigExtension(
  configs: AttachmentEmbedConfig[] = embedConfig
): ExtensionType {
  return {
    setup: di => {
      configs.forEach(option => {
        di.addImpl(AttachmentEmbedConfigIdentifier(option.name), () => option);
      });
    },
  };
}

// A embed config map.
export const AttachmentEmbedConfigMapIdentifier = createIdentifier<
  Map<string, AttachmentEmbedConfig>
>('AffineAttachmentEmbedConfigMapIdentifier');

export const AttachmentEmbedProvider = createIdentifier<AttachmentEmbedService>(
  'AffineAttachmentEmbedProvider'
);

export class AttachmentEmbedService extends Extension {
  private get _maxFileSize() {
    return this.std.store.get(FileSizeLimitService).maxFileSize;
  }

  get keys() {
    return this.configs.keys();
  }

  get values() {
    return this.configs.values();
  }

  get configs(): Map<string, AttachmentEmbedConfig> {
    return this.std.get(AttachmentEmbedConfigMapIdentifier);
  }

  constructor(private readonly std: BlockStdScope) {
    super();
  }

  static override setup(di: Container) {
    di.addImpl(AttachmentEmbedConfigMapIdentifier, provider =>
      provider.getAll(AttachmentEmbedConfigIdentifier)
    );
    di.addImpl(AttachmentEmbedProvider, this, [StdIdentifier]);
  }

  // Converts to embed view.
  convertTo(model: AttachmentBlockModel, maxFileSize = this._maxFileSize) {
    const config = this.values.find(config => config.check(model, maxFileSize));
    if (!config?.action) {
      model.doc.updateBlock(model, { embed: true });
      return;
    }
    config.action(model, this.std)?.catch(console.error);
  }

  embedded(model: AttachmentBlockModel, maxFileSize = this._maxFileSize) {
    return this.values.some(config => config.check(model, maxFileSize));
  }

  render(
    model: AttachmentBlockModel,
    blobUrl?: string,
    maxFileSize = this._maxFileSize
  ) {
    if (!model.props.embed || !blobUrl) return;

    const config = this.values.find(config => config.check(model, maxFileSize));
    if (!config || !config.template) {
      console.error('No embed view template found!', model, model.props.type);
      return;
    }

    return config.template(model, blobUrl);
  }
}

const embedConfig: AttachmentEmbedConfig[] = [
  {
    name: 'image',
    check: model =>
      model.doc.schema.flavourSchemaMap.has('affine:image') &&
      model.props.type.startsWith('image/'),
    async action(model, std) {
      const component = std.view.getBlock(model.id);
      if (!component) return;

      await turnIntoImageBlock(model);
    },
  },
  {
    name: 'pdf',
    check: (model, maxFileSize) =>
      model.props.type === 'application/pdf' && model.props.size <= maxFileSize,
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
      model.props.type.startsWith('video/') && model.props.size <= maxFileSize,
    template: (_, blobUrl) =>
      html`<video
        style="max-height: max-content;"
        width="100%;"
        height="480"
        controls
        src=${blobUrl}
      ></video>`,
  },
  {
    name: 'audio',
    check: (model, maxFileSize) =>
      model.props.type.startsWith('audio/') && model.props.size <= maxFileSize,
    template: (_, blobUrl) =>
      html`<audio controls src=${blobUrl} style="margin: 4px;"></audio>`,
  },
];

/**
 * Turn the attachment block into an image block.
 */
export async function turnIntoImageBlock(model: AttachmentBlockModel) {
  if (!model.doc.schema.flavourSchemaMap.has('affine:image')) {
    console.error('The image flavour is not supported!');
    return;
  }

  const sourceId = model.props.sourceId;
  if (!sourceId) return;

  const { saveAttachmentData, getImageData } = withTempBlobData();
  saveAttachmentData(sourceId, { name: model.props.name });

  let imageSize = model.props.sourceId
    ? getImageData(model.props.sourceId)
    : undefined;

  const bounds = model.xywh
    ? Bound.fromXYWH(model.deserializedXYWH)
    : undefined;

  if (bounds) {
    if (!imageSize?.width || !imageSize?.height) {
      const blob = await getAttachmentBlob(model);
      if (blob) {
        imageSize = await readImageSize(blob);
      }
    }

    if (imageSize?.width && imageSize?.height) {
      const p = imageSize.height / imageSize.width;
      imageSize.width = Math.min(imageSize.width, MAX_IMAGE_WIDTH);
      imageSize.height = imageSize.width * p;
      bounds.w = imageSize.width;
      bounds.h = imageSize.height;
    }
  }

  const others = bounds ? { xywh: bounds.serialize() } : undefined;

  const imageProp: Partial<ImageBlockProps> = {
    sourceId,
    caption: model.props.caption,
    size: model.props.size,
    ...imageSize,
    ...others,
  };
  transformModel(model, 'affine:image', imageProp);
}
