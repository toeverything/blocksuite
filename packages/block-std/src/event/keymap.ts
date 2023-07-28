import { base, keyName } from 'w3c-keyname';

import type { UIEventHandler } from './base.js';

const mac =
  typeof navigator !== 'undefined'
    ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
    : false;

function normalizeKeyName(name: string) {
  const parts = name.split(/-(?!$)/);
  let result = parts.at(-1);
  if (result === 'Space') {
    result = ' ';
  }
  let alt, ctrl, shift, meta;
  parts.slice(0, -1).forEach(mod => {
    if (/^(cmd|meta|m)$/i.test(mod)) {
      meta = true;
      return;
    }
    if (/^a(lt)?$/i.test(mod)) {
      alt = true;
      return;
    }
    if (/^(c|ctrl|control)$/i.test(mod)) {
      ctrl = true;
      return;
    }
    if (/^s(hift)?$/i.test(mod)) {
      shift = true;
      return;
    }
    if (/^mod$/i.test(mod)) {
      if (mac) {
        meta = true;
      } else {
        ctrl = true;
      }
      return;
    }

    throw new Error('Unrecognized modifier name: ' + mod);
  });
  if (alt) result = 'Alt-' + result;
  if (ctrl) result = 'Ctrl-' + result;
  if (meta) result = 'Meta-' + result;
  if (shift) result = 'Shift-' + result;
  return result as string;
}

function modifiers(name: string, event: KeyboardEvent, shift = true) {
  if (event.altKey) name = 'Alt-' + name;
  if (event.ctrlKey) name = 'Ctrl-' + name;
  if (event.metaKey) name = 'Meta-' + name;
  if (shift && event.shiftKey) name = 'Shift-' + name;
  return name;
}

function normalize(map: Record<string, UIEventHandler>) {
  const copy: Record<string, UIEventHandler> = Object.create(null);
  for (const prop in map) copy[normalizeKeyName(prop)] = map[prop];
  return copy;
}

export function bindKeymap(
  bindings: Record<string, UIEventHandler>
): UIEventHandler {
  const map = normalize(bindings);
  return ctx => {
    const state = ctx.get('keyboardState');
    const event = state.raw;
    const name = keyName(event);
    const direct = map[modifiers(name, event)];
    if (direct && direct(ctx)) {
      return true;
    }
    if (name.length !== 1 || name === ' ') {
      return false;
    }

    if (event.shiftKey) {
      const noShift = map[modifiers(name, event, false)];
      if (noShift && noShift(ctx)) {
        return true;
      }
    }

    // none standard keyboard, fallback to keyCode
    const special =
      event.shiftKey ||
      event.altKey ||
      event.metaKey ||
      name.charCodeAt(0) > 127;
    const baseName = base[event.keyCode];
    if (special && baseName && baseName !== name) {
      const fromCode = map[modifiers(baseName, event)];
      if (fromCode && fromCode(ctx)) {
        return true;
      }
    }

    return false;
  };
}
