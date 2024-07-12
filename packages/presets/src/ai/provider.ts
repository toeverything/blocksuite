import type { EditorHost } from '@blocksuite/block-std';

import { PaymentRequiredError, UnauthorizedError } from '@blocksuite/blocks';
import { Slot } from '@blocksuite/store';

export interface AIUserInfo {
  avatarUrl: null | string;
  email: string;
  id: string;
  name: string;
}

export type ActionEventType =
  | 'aborted:login-required'
  | 'aborted:paywall'
  | 'aborted:server-error'
  | 'aborted:stop'
  | 'error'
  | 'finished'
  | 'result:add-note'
  | 'result:add-page'
  | 'result:continue-in-chat'
  | 'result:discard'
  | 'result:insert'
  | 'result:replace'
  | 'result:retry'
  | 'result:use-as-caption'
  | 'started';

/**
 * AI provider for the block suite
 *
 * To use it, downstream (affine) has to provide AI actions implementation,
 * user info etc
 *
 * todo: breakdown into different parts?
 */
export class AIProvider {
  static LAST_ACTION_SESSIONID = '';

  static MAX_LOCAL_HISTORY = 10;

  // track the history of triggered actions (in memory only)
  private readonly actionHistory: {
    action: keyof BlockSuitePresets.AIActions;
    options: BlockSuitePresets.AITextActionOptions;
  }[] = [];

  private readonly actions: Partial<BlockSuitePresets.AIActions> = {};

  private histories: BlockSuitePresets.AIHistoryService | null = null;

  private static readonly instance = new AIProvider();

  private photoEngine: BlockSuitePresets.AIPhotoEngineService | null = null;

  private readonly slots = {
    // use case: when user selects "continue in chat" in an ask ai result panel
    // stream of AI actions triggered by users
    actions: new Slot<{
      action: keyof BlockSuitePresets.AIActions;
      event: ActionEventType;
      options: BlockSuitePresets.AITextActionOptions;
    }>(),
    // do we need to pass the context to the chat panel?
    requestContinueInChat: new Slot<{ host: EditorHost; show: boolean }>(),
    requestLogin: new Slot<{ host: EditorHost }>(),
    // when an action is requested to run in edgeless mode (show a toast in affine)
    requestRunInEdgeless: new Slot<{ host: EditorHost }>(),
    requestUpgradePlan: new Slot<{ host: EditorHost }>(),
    // downstream can emit this slot to notify ai presets that user info has been updated
    userInfo: new Slot<AIUserInfo | null>(),
    // add more if needed
  };

  private toggleGeneralAIOnboarding: ((value: boolean) => void) | null = null;

  private userInfoFn: () => AIUserInfo | Promise<AIUserInfo> | null = () =>
    null;

  static get actionHistory() {
    return AIProvider.instance.actionHistory;
  }

  static get actions() {
    return AIProvider.instance.actions;
  }

  static get histories() {
    return AIProvider.instance.histories;
  }

  static get photoEngine() {
    return AIProvider.instance.photoEngine;
  }

  static provide(
    id: 'userInfo',
    fn: () => AIUserInfo | Promise<AIUserInfo> | null
  ): void;

  static provide(
    id: 'histories',
    service: BlockSuitePresets.AIHistoryService
  ): void;

  static provide(
    id: 'photoEngine',
    engine: BlockSuitePresets.AIPhotoEngineService
  ): void;

  static provide(id: 'onboarding', fn: (value: boolean) => void): void;

  // actions:
  static provide<T extends keyof BlockSuitePresets.AIActions>(
    id: T,
    action: (
      ...options: Parameters<BlockSuitePresets.AIActions[T]>
    ) => ReturnType<BlockSuitePresets.AIActions[T]>
  ): void;

  static provide(id: unknown, action: unknown) {
    if (id === 'userInfo') {
      AIProvider.instance.userInfoFn = action as () => AIUserInfo;
    } else if (id === 'histories') {
      AIProvider.instance.histories =
        action as BlockSuitePresets.AIHistoryService;
    } else if (id === 'photoEngine') {
      AIProvider.instance.photoEngine =
        action as BlockSuitePresets.AIPhotoEngineService;
    } else if (id === 'onboarding') {
      AIProvider.instance.toggleGeneralAIOnboarding = action as (
        value: boolean
      ) => void;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AIProvider.instance.provideAction(id as any, action as any);
    }
  }

  static get slots() {
    return AIProvider.instance.slots;
  }

  static get toggleGeneralAIOnboarding() {
    return AIProvider.instance.toggleGeneralAIOnboarding;
  }

  static get userInfo() {
    return AIProvider.instance.userInfoFn();
  }

  private provideAction<T extends keyof BlockSuitePresets.AIActions>(
    id: T,
    action: (
      ...options: Parameters<BlockSuitePresets.AIActions[T]>
    ) => ReturnType<BlockSuitePresets.AIActions[T]>
  ): void {
    if (this.actions[id]) {
      console.warn(`AI action ${id} is already provided`);
    }
    // @ts-expect-error todo: maybe fix this
    this.actions[id] = (
      ...args: Parameters<BlockSuitePresets.AIActions[T]>
    ) => {
      const options = args[0];
      const slots = this.slots;
      slots.actions.emit({
        action: id,
        event: 'started',
        options,
      });
      this.actionHistory.push({ action: id, options });
      if (this.actionHistory.length > AIProvider.MAX_LOCAL_HISTORY) {
        this.actionHistory.shift();
      }
      // wrap the action with slot actions
      const result: BlockSuitePresets.TextStream | Promise<string> = action(
        ...args
      );
      const isTextStream = (
        m: BlockSuitePresets.TextStream | Promise<string>
      ): m is BlockSuitePresets.TextStream =>
        Reflect.has(m, Symbol.asyncIterator);
      if (isTextStream(result)) {
        return {
          [Symbol.asyncIterator]: async function* () {
            try {
              yield* result;
              slots.actions.emit({
                action: id,
                event: 'finished',
                options,
              });
            } catch (err) {
              slots.actions.emit({
                action: id,
                event: 'error',
                options,
              });
              if (err instanceof PaymentRequiredError) {
                slots.actions.emit({
                  action: id,
                  event: 'aborted:paywall',
                  options,
                });
              } else if (err instanceof UnauthorizedError) {
                slots.actions.emit({
                  action: id,
                  event: 'aborted:login-required',
                  options,
                });
              } else {
                slots.actions.emit({
                  action: id,
                  event: 'aborted:server-error',
                  options,
                });
              }
              throw err;
            }
          },
        };
      } else {
        return result
          .then(result => {
            slots.actions.emit({
              action: id,
              event: 'finished',
              options,
            });
            return result;
          })
          .catch(err => {
            slots.actions.emit({
              action: id,
              event: 'error',
              options,
            });
            if (err instanceof PaymentRequiredError) {
              slots.actions.emit({
                action: id,
                event: 'aborted:paywall',
                options,
              });
            }
            throw err;
          });
      }
    };
  }
}
