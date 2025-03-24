import {
  type EditorToolbar,
  renderToolbarSeparator,
} from '@blocksuite/affine-components/toolbar';
import {
  ActionPlacement,
  type ToolbarAction,
  type ToolbarActions,
  type ToolbarContext,
} from '@blocksuite/affine-shared/services';
import { nextTick } from '@blocksuite/global/utils';
import { MoreVerticalIcon } from '@blocksuite/icons/lit';
import type {
  AutoUpdateOptions,
  Placement,
  ReferenceElement,
  SideObject,
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
import { html, render } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { join } from 'lit/directives/join.js';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import groupBy from 'lodash-es/groupBy';
import mergeWith from 'lodash-es/mergeWith';
import orderBy from 'lodash-es/orderBy';
import partition from 'lodash-es/partition';
import toPairs from 'lodash-es/toPairs';

export const sideMap = new Map([
  // includes frame element
  ['affine:surface:frame', { top: 28 }],
  // includes group element
  ['affine:surface:group', { top: 20 }],
  // has only one shape element
  ['affine:surface:shape', { top: 26, bottom: -26 }],
]);

export function autoUpdatePosition(
  signal: AbortSignal,
  toolbar: EditorToolbar,
  referenceElement: ReferenceElement,
  flavour: string,
  placement: Placement,
  sideOptions: Partial<SideObject> | null,
  options: AutoUpdateOptions = { elementResize: false, animationFrame: true }
) {
  const isInline = flavour === 'affine:note';
  const hasSurfaceScope = flavour.includes('surface');
  const offsetTop = sideOptions?.top ?? 0;
  const offsetBottom = sideOptions?.bottom ?? 0;
  const offsetY = offsetTop + (hasSurfaceScope ? 2 : 0);
  const config = {
    placement,
    middleware: [
      offset(10 + offsetY),
      isInline ? inline() : undefined,
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
  };
  const update = async () => {
    await Promise.race([
      new Promise(resolve => {
        signal.addEventListener('abort', () => resolve(signal.reason), {
          once: true,
        });

        if (signal.aborted) return;

        resolve(null);
      }),
      isInline ? toolbar.updateComplete.then(nextTick) : toolbar.updateComplete,
    ]);

    if (signal.aborted) return;

    const result = await computePosition(referenceElement, toolbar, config);

    const { x, middlewareData, placement: currentPlacement } = result;
    const y =
      result.y -
      (currentPlacement.includes('top') ? 0 : offsetTop + offsetBottom);

    toolbar.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (toolbar.dataset.open) {
      if (middlewareData.hide?.referenceHidden) {
        delete toolbar.dataset.open;
      }
    } else {
      toolbar.dataset.open = 'true';
    }
  };

  return autoUpdate(
    referenceElement,
    toolbar,
    () => {
      update().catch(console.error);
    },
    options
  );
}

export function combine(actions: ToolbarActions, context: ToolbarContext) {
  const grouped = group(actions);

  const generated = grouped.map(action => {
    const newAction = {
      ...action,
      placement: action.placement ?? ActionPlacement.Normal,
    };

    if ('generate' in action && typeof action.generate === 'function') {
      // TODO(@fundon): should delete `generate` fn
      return {
        ...newAction,
        ...action.generate(context),
      };
    }

    return newAction;
  });

  const filtered = generated.filter(action => {
    if (typeof action.when === 'function') return action.when(context);
    return action.when ?? true;
  });

  return filtered;
}

function group(actions: ToolbarAction[]): ToolbarAction[] {
  const grouped = groupBy(actions, a => a.id);

  const paired = toPairs(grouped).map(([_, items]) => {
    if (items.length === 1) return items[0];
    const [first, ...others] = items;
    if (others.length === 1) return merge({ ...first }, others[0]);
    return others.reduce(merge, { ...first });
  });

  return paired;
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
  const hasSurfaceScope = flavour.includes('surface');
  const toolbarRegistry = context.toolbarRegistry;

  const actions = [
    flavour,
    `custom:${flavour}`,
    hasSurfaceScope ? ['affine:surface:*', 'custom:affine:surface:*'] : [],
    'affine:*',
    'custom:affine:*',
  ]
    .flat()
    .map(key => toolbarRegistry.modules.get(key))
    .filter(module => !!module)
    .filter(module =>
      typeof module.config.when === 'function'
        ? module.config.when(context)
        : (module.config.when ?? true)
    )
    .map<ToolbarActions>(module => module.config.actions)
    .flat();

  const combined = combine(actions, context);

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
      const key = `${context.getCurrentModel()?.id}`;

      primaryActionGroup.push({
        id: 'more',
        content: html`${keyed(
          `${flavour}:${key}`,
          html`
            <editor-menu-button
              aria-label="more-menu"
              .contentPadding="${'8px'}"
              .button=${html`
                <editor-icon-button aria-label="More" .tooltip="${'More'}">
                  ${MoreVerticalIcon()}
                </editor-icon-button>
              `}
            >
              <div data-size="large" data-orientation="vertical">
                ${join(moreMenuItems, renderToolbarSeparator('horizontal'))}
              </div>
            </editor-menu-button>
          `
        )}`,
      });
    }
  }

  render(
    join(renderActions(primaryActionGroup, context), renderToolbarSeparator()),
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
      if ('content' in action) {
        if (typeof action.content === 'function') {
          return action.content(context);
        } else {
          return action.content ?? null;
        }
      }

      if ('actions' in action && action.actions.length) {
        const combined = combine(action.actions, context);

        if (!combined.length) return null;

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

      return null;
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
      ?disabled=${action.disabled}
      .tooltip=${action.tooltip}
      @click=${() => action.run?.(context)}
    >
      ${action.icon}
      ${action.showLabel && action.label
        ? html`<span class="label">${action.label}</span>`
        : null}
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
      ?disabled=${action.disabled}
      .tooltip=${ifDefined(action.tooltip)}
      @click=${() => action.run?.(context)}
    >
      ${action.icon}
      ${action.label ? html`<span class="label">${action.label}</span>` : null}
    </editor-menu-action>
  `;
}
