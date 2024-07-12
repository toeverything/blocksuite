declare module 'y-protocols/awareness.js' {
  import { Awareness as _Awareness } from 'y-protocols/awareness';
  type UnknownRecord = Record<string, unknown>;
  export class Awareness<
    State extends UnknownRecord = UnknownRecord,
  > extends _Awareness {
    constructor<State extends UnknownRecord = UnknownRecord>(
      doc: Y.Doc
    ): Awareness<State>;

    getLocalState(): State;
    getStates(): Map<number, State>;
    setLocalState(state: State): void;
    setLocalStateField<Field extends keyof State>(
      field: Field,
      value: State[Field]
    ): void;
  }
}
