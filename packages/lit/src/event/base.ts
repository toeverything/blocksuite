import { assertExists } from '@blocksuite/global/utils';

declare global {
  interface BlockSuiteUIEventState {
    defaultState: UIEventState;
  }

  type UIEventStateType = keyof BlockSuiteUIEventState;
}

type MatchEvent<T extends string> = T extends UIEventStateType
  ? BlockSuiteUIEventState[T]
  : UIEventState;

export class UIEventState {
  /** when extends, override it with pattern `xxxState` */
  type = 'defaultState';

  constructor(public event: Event) {}
}

export class UIEventStateContext {
  private _map: Record<string, UIEventState> = {};

  static from(...states: UIEventState[]) {
    const context = new UIEventStateContext();
    states.forEach(state => {
      context.add(state);
    });
    return context;
  }

  add = <State extends UIEventState = UIEventState>(state: State) => {
    const name = state.type;
    if (this._map[name]) {
      console.warn('UIEventStateContext: state name duplicated', name);
    }

    this._map[name] = state;
  };

  get = <Type extends UIEventStateType = UIEventStateType>(
    type: Type
  ): MatchEvent<Type> => {
    const state = this._map[type];
    assertExists(state, `UIEventStateContext: state ${type} not found`);
    return state as MatchEvent<Type>;
  };
}

export type UIEventHandler = (context: UIEventStateContext) => boolean;
