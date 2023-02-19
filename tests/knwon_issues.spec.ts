import './utils/declare-test-window.js';

import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  type,
} from './utils/actions/index.js';
import { assertRichTexts, assertStoreMatchJSX } from './utils/asserts.js';
import { test } from './utils/playwright.js';
