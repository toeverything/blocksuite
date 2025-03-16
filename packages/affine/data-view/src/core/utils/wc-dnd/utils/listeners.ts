export class Listeners<T extends EventTarget> {
  private readonly listeners: [
    string,
    EventListenerOrEventListenerObject | null,
    AddEventListenerOptions | boolean | undefined,
  ][] = [];

  add: this['target']['addEventListener'] = (eventName, handler, options) => {
    this.target.addEventListener(eventName, handler, options);
    this.listeners.push([eventName, handler, options]);
  };

  removeAll = () => {
    this.listeners.forEach(listener =>
      this.target.removeEventListener(...listener)
    );
  };

  constructor(public target: T) {}
}
