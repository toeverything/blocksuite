import {
  EmbedSyncedDocBlockSchema,
  type EmbedSyncedDocModel,
} from '@labre/affine-model';
import { type BlockStdScope, ConfigExtensionFactory } from '@labre/std';
import type { TemplateResult } from 'lit';

export type EmbedSyncedDocConfig = {
  edgelessHeader: (context: {
    model: EmbedSyncedDocModel;
    std: BlockStdScope;
  }) => TemplateResult;
};

export const EmbedSyncedDocConfigExtension =
  ConfigExtensionFactory<EmbedSyncedDocConfig>(
    EmbedSyncedDocBlockSchema.model.flavour
  );
