import { previewURL, startBrowser } from './common';

export async function runYDocBenchmark() {
  const browser = await startBrowser({ headless: false });
  const page = await browser.newPage();

  await page.goto(previewURL + '?init=preset');
  const pageTitle = page.locator(
    '.affine-default-page-block-title >> text="Welcome to BlockSuite playground"'
  );
  await pageTitle.isVisible();

  const info = await page.evaluate(() => {
    // @ts-ignore
    const Y = window.Y;
    // @ts-ignore
    const workspace = window.workspace;
    const binary: Uint8Array = Y.encodeStateAsUpdate(workspace.doc);

    // size of the binary is
    const binSize = binary.length;

    const yDocSerialized = workspace.serializeYDoc();
    const json = JSON.stringify(yDocSerialized);

    // size of the json is
    const jsonSize = new TextEncoder().encode(json).length;

    return { binSize, jsonSize };
  });

  await browser.close();

  return info;
}
