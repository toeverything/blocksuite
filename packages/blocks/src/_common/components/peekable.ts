import {
  BlockElement,
  type BlockStdScope,
  type Command,
  type DisposableClass,
  type InitCommandCtx,
} from '@blocksuite/block-std';
import { assertExists, type Constructor } from '@blocksuite/global/utils';
import type { LitElement } from 'lit';

export class PeekableController {
  constructor(
    private target: LitElement & {
      std: BlockStdScope;
    }
  ) {}

  private getRootService = () => {
    return this.target.std.spec.getService('affine:page');
  };

  get peekable() {
    return !!this.getRootService().peekViewService;
  }

  peek = () => {
    this.getRootService().peekViewService?.peek(this.target);
  };
}

type PeekableAction = 'double-click' | 'selected-click' | 'shift-click';

type PeekableOptions = {
  action: PeekableAction | PeekableAction[] | false; // false means do not bind any action
  selector?: string; // selector inside of the peekable element to bind the action
};

const symbol = Symbol('peekable');

type PeekableClass = Constructor<
  { std: BlockStdScope } & DisposableClass & LitElement
>;

export const isPeekable = <Element extends LitElement>(e: Element): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Reflect.has(e, symbol) && (e as any)[symbol]?.peekable;
};

export const peek = <Element extends LitElement>(e: Element): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isPeekable(e) && (e as any)[symbol]?.peek();
};

// Peekable decorator
export const Peekable =
  <C extends PeekableClass>(
    options: PeekableOptions = {
      action: ['double-click', 'selected-click', 'shift-click'],
    }
  ) =>
  (Class: C, context: ClassDecoratorContext) => {
    assertExists(context.kind === 'class');
    const actions = Array.isArray(options.action)
      ? options.action
      : options.action
        ? [options.action]
        : [];

    const derivedClass = class extends Class {
      [symbol]: PeekableController = new PeekableController(this);

      override connectedCallback() {
        super.connectedCallback();

        const target: HTMLElement =
          (options.selector ? this.querySelector(options.selector) : this) ||
          this;

        if (actions.includes('double-click')) {
          this.disposables.addFromEvent(target, 'dblclick', e => {
            if (this[symbol].peekable) {
              e.stopPropagation();
              this[symbol].peek();
            }
          });
        }
        if (actions.includes('shift-click')) {
          this.disposables.addFromEvent(target, 'click', e => {
            if (e.shiftKey && this[symbol].peekable) {
              e.stopPropagation();
              e.stopImmediatePropagation();
              this[symbol].peek();
            }
          });
        }
        if (
          actions.includes('selected-click') &&
          this instanceof BlockElement
        ) {
          let lastSelectedTime: number | null = null;
          this.disposables.add(
            this.selection.slots.changed.on(() => {
              const selected = this.selected?.is('block') || false;
              if (selected) {
                if (!lastSelectedTime) {
                  lastSelectedTime = Date.now();
                }
              } else {
                lastSelectedTime = null;
              }
            })
          );
          this.disposables.addFromEvent(target, 'click', e => {
            if (
              this[symbol].peekable &&
              this instanceof BlockElement &&
              lastSelectedTime
                ? Date.now() - lastSelectedTime > 500
                : false
            ) {
              e.stopPropagation();
              e.stopImmediatePropagation();
              this[symbol].peek();
            }
          });
        }
      }
    };
    return derivedClass as unknown as C;
  };

const getSelectedPeekableBlocks = (cmd: InitCommandCtx) => {
  const [result, ctx] = cmd.std.command
    .chain()
    .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
    .getSelectedBlocks({ types: ['text', 'block'] })
    .run();
  return ((result ? ctx.selectedBlocks : []) || []).filter(isPeekable);
};

export const getSelectedPeekableBlocksCommand: Command<
  'selectedBlocks',
  'selectedPeekableBlocks'
> = (ctx, next) => {
  const selectedPeekableBlocks = getSelectedPeekableBlocks(ctx);
  if (selectedPeekableBlocks.length > 0) {
    next({ selectedPeekableBlocks });
  }
};

export const peekSelectedBlockCommand: Command<'selectedBlocks'> = (
  ctx,
  next
) => {
  const peekableBlocks = getSelectedPeekableBlocks(ctx);
  // if there are multiple blocks, peek the first one
  const block = peekableBlocks.at(0);

  if (block) {
    peek(block);
    next();
  }
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      selectedPeekableBlocks?: BlockElement[];
    }

    interface Commands {
      peekSelectedBlock: typeof peekSelectedBlockCommand;
      getSelectedPeekableBlocks: typeof getSelectedPeekableBlocksCommand;
      // todo: add command for peek an inline element?
    }
  }
}
