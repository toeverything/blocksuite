import { toast } from '@blocksuite/affine-components/toast';
import {
  DEFAULT_NOTE_HEIGHT,
  GroupElementModel,
  NoteBlockModel,
  NoteBlockSchema,
  NoteDisplayMode,
  SurfaceRefBlockSchema,
} from '@blocksuite/affine-model';
import { type ToolbarModuleConfig } from '@blocksuite/affine-shared/services';
import { matchModels } from '@blocksuite/affine-shared/utils';
import { getRootBlock } from '@blocksuite/affine-widget-edgeless-toolbar';
import { Bound } from '@blocksuite/global/gfx';
import { EditIcon, PageIcon, UngroupIcon } from '@blocksuite/icons/lit';

import { EdgelessRootService } from '../../edgeless-root-service';
import { mountGroupTitleEditor } from '../../utils/text';

export const builtinGroupToolbarConfig = {
  actions: [
    {
      id: 'a.insert-into-page',
      label: 'Insert into Page',
      showLabel: true,
      tooltip: 'Insert into Page',
      icon: PageIcon(),
      when: ctx => ctx.getSurfaceModelsByType(GroupElementModel).length === 1,
      run(ctx) {
        const model = ctx.getCurrentModelByType(GroupElementModel);
        if (!model) return;

        const rootModel = ctx.store.root;
        if (!rootModel) return;

        const { id: groupId, xywh } = model;
        let lastNoteId = rootModel.children
          .filter(
            note =>
              matchModels(note, [NoteBlockModel]) &&
              note.props.displayMode !== NoteDisplayMode.EdgelessOnly
          )
          .pop()?.id;

        if (!lastNoteId) {
          const bounds = Bound.deserialize(xywh);
          bounds.y += bounds.h;
          bounds.h = DEFAULT_NOTE_HEIGHT;

          lastNoteId = ctx.store.addBlock(
            NoteBlockSchema.model.flavour,
            { xywh: bounds.serialize() },
            rootModel.id
          );
        }

        ctx.store.addBlock(
          SurfaceRefBlockSchema.model.flavour,
          { reference: groupId, refFlavour: 'group' },
          lastNoteId
        );

        toast(ctx.host, 'Group has been inserted into doc');
      },
    },
    {
      id: 'b.rename',
      tooltip: 'Rename',
      icon: EditIcon(),
      when: ctx => ctx.getSurfaceModelsByType(GroupElementModel).length === 1,
      run(ctx) {
        const model = ctx.getCurrentModelByType(GroupElementModel);
        if (!model) return;

        const rootBlock = getRootBlock(ctx);
        if (!rootBlock) return;

        mountGroupTitleEditor(model, rootBlock);
      },
    },
    {
      id: 'b.ungroup',
      tooltip: 'Ungroup',
      icon: UngroupIcon(),
      run(ctx) {
        const models = ctx.getSurfaceModelsByType(GroupElementModel);
        if (!models.length) return;

        const edgelessService = ctx.std.get(EdgelessRootService);

        for (const model of models) {
          edgelessService.ungroup(model);
        }
      },
    },
  ],

  when: ctx => ctx.getSurfaceModelsByType(GroupElementModel).length > 0,
} as const satisfies ToolbarModuleConfig;
