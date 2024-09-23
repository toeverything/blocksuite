import { expect } from '@playwright/test';

import {
  pressArrowLeft,
  pressBackspace,
  pressEnter,
  pressShiftEnter,
  type,
} from '../utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
} from '../utils/actions/misc.js';
import { test } from '../utils/playwright.js';

test('add inline latex at the start of line', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const latexEditor = page.locator('latex-editor-menu v-line div');
  const latexElement = page.locator(
    'affine-paragraph rich-text affine-latex-node'
  );

  expect(await latexEditor.isVisible()).not.toBeTruthy();
  expect(await latexElement.isVisible()).not.toBeTruthy();
  await type(page, '$$ ');
  expect(await latexEditor.isVisible()).toBeTruthy();
  expect(await latexElement.isVisible()).toBeTruthy();
  expect(await latexElement.locator('.placeholder').innerText()).toBe(
    'Equation'
  );
  await type(page, 'E=mc^2');
  expect(await latexEditor.innerText()).toBe('E=mc^2');
  expect(await latexElement.locator('.katex').innerHTML()).toBe(
    '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">E=mc^2</annotation></semantics></math>'
  );

  await pressEnter(page);
  expect(await latexEditor.isVisible()).not.toBeTruthy();
  expect(await latexElement.locator('.katex').innerHTML()).toBe(
    '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">E=mc^2</annotation></semantics></math>'
  );
});

test('add inline latex in the middle of text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const latexEditor = page.locator('latex-editor-menu v-line div');
  const latexElement = page.locator(
    'affine-paragraph rich-text affine-latex-node'
  );

  expect(await latexEditor.isVisible()).not.toBeTruthy();
  expect(await latexElement.isVisible()).not.toBeTruthy();
  await type(page, 'aaaa');
  await pressArrowLeft(page, 2);
  await type(page, '$$ ');
  expect(await latexEditor.isVisible()).toBeTruthy();
  expect(await latexElement.isVisible()).toBeTruthy();
  expect(await latexElement.locator('.placeholder').innerText()).toBe(
    'Equation'
  );
  await type(page, 'E=mc^2');
  expect(await latexEditor.innerText()).toBe('E=mc^2');
  expect(await latexElement.locator('.katex').innerHTML()).toBe(
    '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">E=mc^2</annotation></semantics></math>'
  );

  await pressEnter(page);
  expect(await latexEditor.isVisible()).not.toBeTruthy();
  expect(await latexElement.locator('.katex').innerHTML()).toBe(
    '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">E=mc^2</annotation></semantics></math>'
  );
});

test('update inline latex by clicking the node', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const latexEditor = page.locator('latex-editor-menu v-line div');
  const latexElement = page.locator(
    'affine-paragraph rich-text affine-latex-node'
  );

  expect(await latexEditor.isVisible()).not.toBeTruthy();
  await type(page, '$$ ');
  expect(await latexEditor.isVisible()).toBeTruthy();
  await type(page, 'E=mc^2');
  await pressEnter(page);
  expect(await latexEditor.isVisible()).not.toBeTruthy();
  await latexElement.click();
  expect(await latexEditor.isVisible()).toBeTruthy();
  await pressBackspace(page, 6);
  await type(page, String.raw`\def\arraystretch{1.5}`);
  await pressShiftEnter(page);
  await type(page, String.raw`\begin{array}{c:c:c}`);
  await pressShiftEnter(page);
  await type(page, String.raw`a & b & c \\ \\ hline`);
  await pressShiftEnter(page);
  await type(page, String.raw`d & e & f \\`);
  await pressShiftEnter(page);
  await type(page, String.raw`\hdashline`);
  await pressShiftEnter(page);
  await type(page, String.raw`g & h & i`);
  await pressShiftEnter(page);
  await type(page, String.raw`\end{array}`);
  expect(await latexElement.locator('.katex').innerHTML()).toBe(
    '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mtable rowspacing="0.66em" columnalign="center center center" columnlines="dashed dashed" columnspacing="1em" rowlines="none none dashed"><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>a</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>b</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>c</mi></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mrow></mrow></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mrow><mi>h</mi><mi>l</mi><mi>i</mi><mi>n</mi><mi>e</mi><mi>d</mi></mrow></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>e</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>f</mi></mstyle></mtd></mtr><mtr><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>g</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>h</mi></mstyle></mtd><mtd><mstyle scriptlevel="0" displaystyle="false"><mi>i</mi></mstyle></mtd></mtr></mtable><annotation encoding="application/x-tex">\\def\\arraystretch{1.5}\n\\begin{array}{c:c:c}\na &amp; b &amp; c \\\\ \\\\ hline\nd &amp; e &amp; f \\\\\n\\hdashline\ng &amp; h &amp; i\n\\end{array}</annotation></semantics></math>'
  );

  // click outside to hide the editor
  await page.click('affine-editor-container');
  expect(await latexEditor.isVisible()).not.toBeTruthy();
});
