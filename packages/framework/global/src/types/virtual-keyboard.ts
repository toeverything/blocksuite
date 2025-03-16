declare global {
  interface Navigator {
    readonly virtualKeyboard?: VirtualKeyboard;
  }

  interface VirtualKeyboard extends EventTarget {
    readonly boundingRect: DOMRect;
    overlaysContent: boolean;
    hide: () => void;
    show: () => void;
    ongeometrychange: ((this: VirtualKeyboard, ev: Event) => any) | null;
    addEventListener<K extends keyof VirtualKeyboardEventMap>(
      type: K,
      listener: (this: VirtualKeyboard, ev: VirtualKeyboardEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof VirtualKeyboardEventMap>(
      type: K,
      listener: (this: VirtualKeyboard, ev: VirtualKeyboardEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ): void;
  }

  interface VirtualKeyboardEventMap {
    geometrychange: Event;
  }

  interface ElementContentEditable {
    virtualKeyboardPolicy: string;
  }
}

export {};
