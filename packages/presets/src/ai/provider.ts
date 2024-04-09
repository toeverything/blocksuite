export interface AIUserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * AI provider for the block suite
 *
 * To use it, downstream (affine) has to provide AI actions implementation,
 * user info etc
 */
export class AIProvider {
  private readonly actions: Partial<BlockSuitePresets.AIActions> = {};
  private userInfoFn: () => AIUserInfo | Promise<AIUserInfo> | null = () =>
    null;
  private static readonly instance = new AIProvider();

  static provideAction<T extends keyof BlockSuitePresets.AIActions>(
    id: T,
    action: (
      ...options: Parameters<BlockSuitePresets.AIActions[T]>
    ) => ReturnType<BlockSuitePresets.AIActions[T]>
  ): void {
    if (AIProvider.instance.actions[id]) {
      console.warn(`AI action ${id} is already provided`);
    }
    // @ts-expect-error todo: maybe fix this
    AIProvider.instance.actions[id] = action;
  }

  static provideUserInfo(fn: () => AIUserInfo | null) {
    AIProvider.instance.userInfoFn = fn;
  }

  static get actions() {
    return AIProvider.instance.actions;
  }

  static get userInfo() {
    return AIProvider.instance.userInfoFn();
  }

  // todo: add histories and other methods
}
