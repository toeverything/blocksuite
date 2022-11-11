export type Ability<T> =
  | ({
      enabled: true;
    } & T)
  | {
      enabled: false;
      userMessage: string;
    };

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Ability {
  export function disabled<T>(userMessage: string): Ability<T> {
    return {
      enabled: false,
      userMessage,
    };
  }
}
