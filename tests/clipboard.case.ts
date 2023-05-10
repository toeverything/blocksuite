test(scoped`paste from FeiShu list format`, async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2438',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  // set up clipboard data using html
  const clipData = {
    'text/html': `<div><li><div><span>aaaa</span></div></li></div>`,
  };
  await waitNextFrame(page);
  await page.evaluate(
    ({ clipData }) => {
      const dT = new DataTransfer();
      const e = new ClipboardEvent('paste', { clipboardData: dT });
      Object.defineProperty(e, 'target', {
        writable: false,
        value: document.body,
      });
      e.clipboardData?.setData('text/html', clipData['text/html']);
      document.body.dispatchEvent(e);
    },
    { clipData }
  );
  await assertText(page, 'aaaa');
  await assertBlockTypes(page, ['bulleted']);
});
