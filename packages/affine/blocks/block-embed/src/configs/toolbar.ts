import { toast } from '@blocksuite/affine-components/toast';
import {
  BookmarkStyles,
  EmbedGithubModel,
  isExternalEmbedModel,
} from '@blocksuite/affine-model';
import {
  ActionPlacement,
  EmbedOptionProvider,
  type ToolbarAction,
  type ToolbarActionGroup,
  type ToolbarModuleConfig,
} from '@blocksuite/affine-shared/services';
import { getBlockProps } from '@blocksuite/affine-shared/utils';
import { BlockSelection } from '@blocksuite/block-std';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  ResetIcon,
} from '@blocksuite/icons/lit';
import { Slice, Text } from '@blocksuite/store';
import { signal } from '@preact/signals-core';
import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import * as Y from 'yjs';

import type { EmbedFigmaBlockComponent } from '../embed-figma-block';
import type { EmbedGithubBlockComponent } from '../embed-github-block';
import type { EmbedLoomBlockComponent } from '../embed-loom-block';
import type { EmbedYoutubeBlockComponent } from '../embed-youtube-block';

const trackBaseProps = {
  segment: 'doc',
  page: 'doc editor',
  module: 'toolbar',
  category: 'link',
  type: 'card view',
};

// External embed blocks
export function createBuiltinToolbarConfigForExternal(
  klass:
    | typeof EmbedGithubBlockComponent
    | typeof EmbedFigmaBlockComponent
    | typeof EmbedLoomBlockComponent
    | typeof EmbedYoutubeBlockComponent
) {
  return {
    actions: [
      {
        id: 'a.preview',
        content(ctx) {
          const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
          if (!model || !isExternalEmbedModel(model)) return null;

          const { url } = model.props;
          const options = ctx.std
            .get(EmbedOptionProvider)
            .getEmbedBlockOptions(url);

          if (options?.viewType !== 'card') return null;

          return html`<affine-link-preview .url=${url}></affine-link-preview>`;
        },
      },
      {
        id: 'b.conversions',
        actions: [
          {
            id: 'inline',
            label: 'Inline view',
            run(ctx) {
              const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
              if (!model || !isExternalEmbedModel(model)) return;

              const { title, caption, url: link } = model.props;
              const { parent } = model;
              const index = parent?.children.indexOf(model);

              const yText = new Y.Text();
              const insert = title || caption || link;
              yText.insert(0, insert);
              yText.format(0, insert.length, { link });

              const text = new Text(yText);

              ctx.store.addBlock('affine:paragraph', { text }, parent, index);

              ctx.store.deleteBlock(model);

              // Clears
              ctx.select('note');
              ctx.reset();

              ctx.track('SelectedView', {
                ...trackBaseProps,
                control: 'select view',
                type: 'inline view',
              });
            },
          },
          {
            id: 'card',
            label: 'Card view',
            disabled(ctx) {
              const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
              if (!model || !isExternalEmbedModel(model)) return true;

              const { url } = model.props;
              const options = ctx.std
                .get(EmbedOptionProvider)
                .getEmbedBlockOptions(url);

              return options?.viewType === 'card';
            },
            run(ctx) {
              const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
              if (!model || !isExternalEmbedModel(model)) return;

              const { url, caption } = model.props;
              const { parent } = model;
              const index = parent?.children.indexOf(model);
              const options = ctx.std
                .get(EmbedOptionProvider)
                .getEmbedBlockOptions(url);

              let { style } = model.props;
              let flavour = 'affine:bookmark';

              if (options?.viewType === 'card') {
                flavour = options.flavour;
                if (!options.styles.includes(style)) {
                  style = options.styles[0];
                }
              } else {
                style =
                  BookmarkStyles.find(s => s !== 'vertical' && s !== 'cube') ??
                  BookmarkStyles[1];
              }

              const blockId = ctx.store.addBlock(
                flavour,
                { url, caption, style },
                parent,
                index
              );

              ctx.store.deleteBlock(model);

              // Selects new block
              ctx.select('note', [
                ctx.selection.create(BlockSelection, { blockId }),
              ]);

              ctx.track('SelectedView', {
                ...trackBaseProps,
                control: 'select view',
                type: 'card view',
              });
            },
          },
          {
            id: 'embed',
            label: 'Embed view',
            disabled(ctx) {
              const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
              if (!model || !isExternalEmbedModel(model)) return false;

              const { url } = model.props;
              const options = ctx.std
                .get(EmbedOptionProvider)
                .getEmbedBlockOptions(url);

              return options?.viewType === 'embed';
            },
            when(ctx) {
              const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
              if (!model || !isExternalEmbedModel(model)) return false;

              const { url } = model.props;
              const options = ctx.std
                .get(EmbedOptionProvider)
                .getEmbedBlockOptions(url);

              return options?.viewType === 'embed';
            },
            run(ctx) {
              const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
              if (!model || !isExternalEmbedModel(model)) return;

              const { url, caption } = model.props;
              const { parent } = model;
              const index = parent?.children.indexOf(model);
              const options = ctx.std
                .get(EmbedOptionProvider)
                .getEmbedBlockOptions(url);

              if (options?.viewType !== 'embed') return;

              const { flavour, styles } = options;
              let { style } = model.props;

              if (!styles.includes(style)) {
                style =
                  styles.find(s => s !== 'vertical' && s !== 'cube') ??
                  styles[0];
              }

              const blockId = ctx.store.addBlock(
                flavour,
                { url, caption, style },
                parent,
                index
              );

              ctx.store.deleteBlock(model);

              // Selects new block
              ctx.select('note', [
                ctx.selection.create(BlockSelection, { blockId }),
              ]);

              ctx.track('SelectedView', {
                ...trackBaseProps,
                control: 'select view',
                type: 'embed view',
              });
            },
          },
        ],
        content(ctx) {
          const model = ctx.getCurrentBlockBy(BlockSelection)?.model;
          if (!model || !isExternalEmbedModel(model)) return null;

          const { url } = model.props;
          const viewType =
            ctx.std.get(EmbedOptionProvider).getEmbedBlockOptions(url)
              ?.viewType ?? 'card';
          const actions = this.actions.map(action => ({ ...action }));
          const viewType$ = signal(
            `${viewType === 'card' ? 'Card' : 'Embed'} view`
          );

          const toggle = (e: CustomEvent<boolean>) => {
            const opened = e.detail;
            if (!opened) return;

            ctx.track('OpenedViewSelector', {
              ...trackBaseProps,
              control: 'switch view',
            });
          };

          return html`${keyed(
            model,
            html`<affine-view-dropdown-menu
              .actions=${actions}
              .context=${ctx}
              .toggle=${toggle}
              .viewType$=${viewType$}
            ></affine-view-dropdown-menu>`
          )}`;
        },
      } satisfies ToolbarActionGroup<ToolbarAction>,
      {
        id: 'c.style',
        actions: [
          {
            id: 'horizontal',
            label: 'Large horizontal style',
          },
          {
            id: 'list',
            label: 'Small horizontal style',
          },
        ],
        content(ctx) {
          const model = ctx.getCurrentModelByType(
            BlockSelection,
            EmbedGithubModel
          );
          if (!model) return null;

          const actions = this.actions.map(action => ({
            ...action,
            run: ({ store }) => {
              store.updateBlock(model, { style: action.id });

              ctx.track('SelectedCardStyle', {
                ...trackBaseProps,
                control: 'select card style',
                type: action.id,
              });
            },
          })) satisfies ToolbarAction[];

          const toggle = (e: CustomEvent<boolean>) => {
            const opened = e.detail;
            if (!opened) return;

            ctx.track('OpenedCardStyleSelector', {
              ...trackBaseProps,
              control: 'switch card style',
            });
          };

          return html`${keyed(
            model,
            html`<affine-card-style-dropdown-menu
              .actions=${actions}
              .context=${ctx}
              .toggle=${toggle}
              .style$=${model.props.style$}
            ></affine-card-style-dropdown-menu>`
          )}`;
        },
      } satisfies ToolbarActionGroup<ToolbarAction>,
      {
        id: 'd.caption',
        tooltip: 'Caption',
        icon: CaptionIcon(),
        run(ctx) {
          const component = ctx.getCurrentBlockComponentBy(
            BlockSelection,
            klass
          );
          if (!component) return;

          component.captionEditor?.show();

          ctx.track('OpenedCaptionEditor', {
            ...trackBaseProps,
            control: 'add caption',
          });
        },
      },
      {
        placement: ActionPlacement.More,
        id: 'a.clipboard',
        actions: [
          {
            id: 'copy',
            label: 'Copy',
            icon: CopyIcon(),
            run(ctx) {
              const model = ctx.getCurrentModelBy(BlockSelection);
              if (!model || !isExternalEmbedModel(model)) return;

              const slice = Slice.fromModels(ctx.store, [model]);
              ctx.clipboard
                .copySlice(slice)
                .then(() => toast(ctx.host, 'Copied to clipboard'))
                .catch(console.error);
            },
          },
          {
            id: 'duplicate',
            label: 'Duplicate',
            icon: DuplicateIcon(),
            run(ctx) {
              const model = ctx.getCurrentModelBy(BlockSelection);
              if (!model || !isExternalEmbedModel(model)) return;

              const { flavour, parent } = model;
              const props = getBlockProps(model);
              const index = parent?.children.indexOf(model);

              ctx.store.addBlock(flavour, props, parent, index);
            },
          },
        ],
      },
      {
        placement: ActionPlacement.More,
        id: 'b.reload',
        label: 'Reload',
        icon: ResetIcon(),
        run(ctx) {
          const component = ctx.getCurrentBlockComponentBy(
            BlockSelection,
            klass
          );
          component?.refreshData();
        },
      },
      {
        placement: ActionPlacement.More,
        id: 'c.delete',
        label: 'Delete',
        icon: DeleteIcon(),
        variant: 'destructive',
        run(ctx) {
          const model = ctx.getCurrentModelBy(BlockSelection);
          if (!model || !isExternalEmbedModel(model)) return;

          ctx.store.deleteBlock(model);

          // Clears
          ctx.select('note');
          ctx.reset();
        },
      },
    ],
  } as const satisfies ToolbarModuleConfig;
}
