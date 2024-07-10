import type {
  BlockElement,
  BlockStdScope,
  Command,
  DisposableClass,
  InitCommandCtx,
} from '@blocksuite/block-std';
import { assertExists, type Constructor } from '@blocksuite/global/utils';
import type { LitElement, TemplateResult } from 'lit';

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

  peek = (template?: TemplateResult) => {
    return Promise.resolve<void>(
      this.getRootService().peekViewService?.peek(this.target, template)
    );
  };
}

export interface PeekViewService {
  /**
   * Peek a target element page ref info
   * @param pageRef The page ref info to peek.
   * @returns A promise that resolves when the peek view is closed.
   */
  peek(pageRef: { docId: string; blockId?: string }): Promise<void>;
  /**
   * Peek a target element with a optional template
   * @param target The target element to peek. There are two use cases:
   * 1. If the template is not given, peek view content rendering will be delegated to the implementation of peek view service.
   * 2. To determine the origin of the peek view modal animation
   * @param template Optional template to render in the peek view modal. If not given, the peek view service will render the content.
   * @returns A promise that resolves when the peek view is closed.
   */
  peek(target: HTMLElement, template?: TemplateResult): Promise<void>;
  /**
   * Peek a target element with a optional template
   * @param target The target element to peek. There are two use cases:
   * 1. If the template is not given, peek view content rendering will be delegated to the implementation of peek view service.
   * 2. To determine the origin of the peek view modal animation
   * @param template Optional template to render in the peek view modal. If not given, the peek view service will render the content.
   * @returns A promise that resolves when the peek view is closed.
   */
  peek<Element extends BlockElement>(
    target: Element,
    template?: TemplateResult
  ): Promise<void>;
}

type PeekableAction = 'double-click' | 'shift-click';

type PeekableOptions = {
  /**
   * Action to bind to the peekable element. default to ['double-click', 'shift-click']
   * false means do not bind any action.
   */
  action: PeekableAction | PeekableAction[] | false;
  /**
   * Selector inside of the peekable element to bind the action
   */
  selector?: string;
};

const symbol = Symbol('peekable');

type PeekableClass = Constructor<
  { std: BlockStdScope } & DisposableClass & LitElement
>;

export const isPeekable = <Element extends LitElement>(e: Element): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Reflect.has(e, symbol) && (e as any)[symbol]?.peekable;
};

export const peek = <Element extends LitElement>(
  e: Element,
  template?: TemplateResult
): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isPeekable(e) && (e as any)[symbol]?.peek(template);
};

/**
 * Mark a class as peekable, which means the class can be peeked by the peek view service.
 *
 * Note: This class must be syntactically below the `@customElement` decorator (it will be applied before customElement).
 */
export const Peekable =
  <C extends PeekableClass>(
    options: PeekableOptions = {
      action: ['double-click', 'shift-click'],
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
              this[symbol].peek().catch(console.error);
            }
          });
        }
        if (actions.includes('shift-click')) {
          this.disposables.addFromEvent(target, 'click', e => {
            if (e.shiftKey && this[symbol].peekable) {
              e.stopPropagation();
              e.stopImmediatePropagation();
              this[symbol].peek().catch(console.error);
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
