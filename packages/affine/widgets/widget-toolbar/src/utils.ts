import {
  type EditorToolbar,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import {
  ActionPlacement,
  type ToolbarAction,
  type ToolbarActions,
  type ToolbarContext,
  type ToolbarModuleConfig,
} from '@blocksuite/affine-shared/services';
import { BlockSelection } from '@blocksuite/block-std';
import { nextTick } from '@blocksuite/global/utils';
import { MoreVerticalIcon } from '@blocksuite/icons/lit';
import type {
  AutoUpdateOptions,
  Placement,
  ReferenceElement,
} from '@floating-ui/dom';
import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  inline,
  limitShift,
  offset,
  shift,
} from '@floating-ui/dom';
import { html, render, type TemplateResult } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { join } from 'lit/directives/join.js';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import groupBy from 'lodash-es/groupBy';
import mergeWith from 'lodash-es/mergeWith';
import orderBy from 'lodash-es/orderBy';
import partition from 'lodash-es/partition';
import toPairs from 'lodash-es/toPairs';

export function autoUpdatePosition(
  referenceElement: ReferenceElement,
  toolbar: EditorToolbar,
  placement: Placement = 'top-start',
  options: AutoUpdateOptions = { elementResize: false, animationFrame: true }
) {
  const abortController = new AbortController();
  const signal = abortController.signal;
  const update = async () => {
    await Promise.race([
      new Promise(resolve => {
        const listener = () => resolve(signal.reason);
        signal.addEventListener('abort', listener, { once: true });

        if (signal.aborted) return;

        signal.removeEventListener('abort', listener);
        resolve(null);
      }),
      toolbar.updateComplete.then(nextTick),
    ]);

    if (signal.aborted) return;

    const { x, y } = await computePosition(referenceElement, toolbar, {
      placement,
      middleware: [
        offset(10),
        inline(),
        shift(state => ({
          padding: {
            top: 10,
            right: 10,
            bottom: 150,
            left: 10,
          },
          crossAxis: state.placement.includes('bottom'),
          limiter: limitShift(),
        })),
        flip({ padding: 10 }),
        hide(),
      ],
    });

    toolbar.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const cleanup = autoUpdate(
    referenceElement,
    toolbar,
    () => {
      update().catch(console.error);
    },
    options
  );

  return () => {
    cleanup();
    if (signal.aborted) return;
    abortController.abort();
  };
}

function group(actions: ToolbarAction[]) {
  const grouped = groupBy(actions, a => a.id);

  const paired = toPairs(grouped).map(([_, items]) => {
    if (items.length === 1) return items[0];
    const [first, ...others] = items;
    if (others.length === 1) return merge({ ...first }, others[0]);
    return others.reduce(merge, { ...first });
  });

  return paired;
}

export function combine(actions: ToolbarActions, context: ToolbarContext) {
  const grouped = group(actions);

  const generated = grouped.map(action => {
    if ('generate' in action && action.generate) {
      // TODO(@fundon): should delete `generate` fn
      return {
        ...action,
        ...action.generate(context),
      };
    }
    return action;
  });

  const filtered = generated.filter(action => {
    if (typeof action.when === 'function') return action.when(context);
    return action.when ?? true;
  });

  return filtered;
}

const merge = (a: any, b: any) =>
  mergeWith(a, b, (obj, src) =>
    Array.isArray(obj) ? group(obj.concat(src)) : src
  );

/**
 * Renders toolbar
 *
 * Merges the following configs:
 * 1. `affine:note`
 * 2. `custom:affine:note`
 * 3. `affine:*`
 * 4. `custom:affine:*`
 */
export function renderToolbar(
  toolbar: EditorToolbar,
  context: ToolbarContext,
  flavour: string
) {
  const toolbarRegistry = context.toolbarRegistry;
  const module = toolbarRegistry.modules.get(flavour);
  if (!module) return;
  const customModule = toolbarRegistry.modules.get(`custom:${flavour}`);
  const customWildcardModule = toolbarRegistry.modules.get(`custom:affine:*`);
  const config = module.config satisfies ToolbarModuleConfig;
  const customConfig = (customModule?.config ?? {
    actions: [],
  }) satisfies ToolbarModuleConfig;
  const customWildcardConfig = (customWildcardModule?.config ?? {
    actions: [],
  }) satisfies ToolbarModuleConfig;

  const combined = combine(
    [
      ...config.actions,
      ...customConfig.actions,
      ...customWildcardConfig.actions,
    ],
    context
  );

  const ordered = orderBy(
    combined,
    ['placement', 'id', 'score'],
    ['asc', 'asc', 'asc']
  );

  const [moreActionGroup, primaryActionGroup] = partition(
    ordered,
    a => a.placement === ActionPlacement.More
  );

  if (moreActionGroup.length) {
    const moreMenuItems = renderActions(
      moreActionGroup,
      context,
      renderMenuActionItem
    );
    if (moreMenuItems.length) {
      // TODO(@fundon): edgeless case needs to be considered
      const key = `${flavour}:${context.getCurrentModelBy(BlockSelection)?.id}`;

      primaryActionGroup.push({
        id: 'more',
        content: html`${keyed(
          key,
          html`
            <editor-menu-button
              class="more-menu"
              .contentPadding="${'8px'}"
              .button=${html`
                <editor-icon-button aria-label="More" .tooltip="${'More'}">
                  ${MoreVerticalIcon()}
                </editor-icon-button>
              `}
            >
              <div data-size="large" data-orientation="vertical">
                ${join(moreMenuItems, () =>
                  renderToolbarSeparator('horizontal')
                )}
              </div>
            </editor-menu-button>
          `
        )}`,
      });
    }
  }

  render(
    join(renderActions(primaryActionGroup, context), () =>
      renderToolbarSeparator()
    ),
    toolbar
  );
}

function renderActions(
  actions: ToolbarActions,
  context: ToolbarContext,
  render = renderActionItem
) {
  return actions
    .map(action => {
      let content: TemplateResult | null = null;
      if ('content' in action) {
        if (typeof action.content === 'function') {
          content = action.content(context);
        } else {
          content = action.content ?? null;
        }
        return content;
      }

      if ('actions' in action && action.actions.length) {
        const combined = combine(action.actions, context);

        if (!combined.length) return content;

        const ordered = orderBy(combined, ['id', 'score'], ['asc', 'asc']);

        return repeat(
          ordered,
          a => a.id,
          a => {
            if ('content' in a) {
              if (typeof a.content === 'function') {
                return a.content(context);
              } else {
                return a.content ?? null;
              }
            }
            return render(a, context);
          }
        );
      }

      if ('run' in action && action.run) {
        return render(action, context);
      }

      return content;
    })
    .filter(action => action !== null);
}

// TODO(@fundon): supports templates
function renderActionItem(action: ToolbarAction, context: ToolbarContext) {
  const ids = action.id.split('.');
  const id = ids[ids.length - 1];
  return html`
    <editor-icon-button
      data-testid=${ifDefined(id)}
      aria-label=${ifDefined(action.label ?? action.tooltip ?? id)}
      ?active=${typeof action.active === 'function'
        ? action.active(context)
        : action.active}
      .tooltip=${action.tooltip}
      @click=${() => action.run?.(context)}
    >
      ${action.icon}
      ${action.label ? html`<span class="label">${action.label}</span>` : null}
    </editor-icon-button>
  `;
}

function renderMenuActionItem(action: ToolbarAction, context: ToolbarContext) {
  const ids = action.id.split('.');
  const id = ids[ids.length - 1];
  return html`
    <editor-menu-action
      data-testid=${ifDefined(id)}
      aria-label=${ifDefined(action.label ?? action.tooltip ?? id)}
      class="${ifDefined(
        action.variant === 'destructive' ? 'delete' : undefined
      )}"
      ?active=${typeof action.active === 'function'
        ? action.active(context)
        : action.active}
      .tooltip=${ifDefined(action.tooltip)}
      @click=${() => action.run?.(context)}
    >
      ${action.icon}
      ${action.label ? html`<span class="label">${action.label}</span>` : null}
    </editor-menu-action>
  `;
}
