import { toggleEmbedCardCreateModal } from '@blocksuite/affine-components/embed-card-modal';
import type { SlashMenuConfig } from '@blocksuite/affine-widget-slash-menu';
import { YoutubeDuotoneIcon } from '@blocksuite/icons/lit';

import { YoutubeVideoTooltip } from './tooltips';

export const embedYoutubeSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'YouTube',
      description: 'Embed a YouTube video.',
      icon: YoutubeDuotoneIcon(),
      tooltip: {
        figure: YoutubeVideoTooltip,
        caption: 'YouTube Video',
      },
      group: '4_Content & Media@5',
      when: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-youtube'),
      action: ({ std, model }) => {
        (async () => {
          const { host } = std;
          const parentModel = host.doc.getParent(model);
          if (!parentModel) {
            return;
          }
          const index = parentModel.children.indexOf(model) + 1;
          await toggleEmbedCardCreateModal(
            host,
            'YouTube',
            'The added YouTube video link will be displayed as an embed view.',
            { mode: 'page', parentModel, index }
          );
          if (model.text?.length === 0) std.store.deleteBlock(model);
        })().catch(console.error);
      },
    },
  ],
};
