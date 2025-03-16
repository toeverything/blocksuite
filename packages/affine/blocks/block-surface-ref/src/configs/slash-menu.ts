import { getSurfaceBlock } from '@blocksuite/affine-block-surface';
import type { FrameBlockModel } from '@blocksuite/affine-model';
import { getSelectedModelsCommand } from '@blocksuite/affine-shared/commands';
import {
  type SlashMenuActionItem,
  type SlashMenuConfig,
  SlashMenuConfigExtension,
} from '@blocksuite/affine-widget-slash-menu';
import { FrameIcon, GroupingIcon } from '@blocksuite/icons/lit';

import { insertSurfaceRefBlockCommand } from '../commands';
import { EdgelessTooltip } from './tooltips';

const surfaceRefSlashMenuConfig: SlashMenuConfig = {
  items: ({ std }) => {
    let index = 0;

    const surfaceModel = getSurfaceBlock(std.store);
    if (!surfaceModel) return [];

    const frameModels = std.store
      .getBlocksByFlavour('affine:frame')
      .map(block => block.model as FrameBlockModel);

    const frameItems = frameModels.map<SlashMenuActionItem>(frameModel => ({
      name: 'Frame: ' + frameModel.props.title,
      icon: FrameIcon(),
      group: `5_Document Group & Frame@${index++}`,
      tooltip: {
        figure: EdgelessTooltip,
        caption: 'Edgeless',
      },
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertSurfaceRefBlockCommand, {
            reference: frameModel.id,
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    }));

    const groupElements = surfaceModel.getElementsByType('group');
    const groupItems = groupElements.map<SlashMenuActionItem>(group => ({
      name: 'Group: ' + group.title.toString(),
      icon: GroupingIcon(),
      group: `5_Document Group & Frame@${index++}`,
      tooltip: {
        figure: EdgelessTooltip,
        caption: 'Edgeless',
      },
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertSurfaceRefBlockCommand, {
            reference: group.id,
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    }));

    return [...frameItems, ...groupItems];
  },
};

export const SurfaceRefSlashMenuConfigExtension = SlashMenuConfigExtension(
  'affine:surface-ref',
  surfaceRefSlashMenuConfig
);
