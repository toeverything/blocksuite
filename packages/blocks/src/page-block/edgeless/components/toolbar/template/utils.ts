import { on } from '../../../../../_common/utils/event.js';

export function onClickOutside(target: HTMLElement, fn: () => void) {
  return on(document, 'click', (evt: MouseEvent) => {
    if (target.contains(evt.target as Node)) return;

    fn();

    return;
  });
}
