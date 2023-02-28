import { Browser, chromium, Page } from '@playwright/test';

export const previewURL = `http://127.0.0.1:4173/`;

export async function forceGC(page: Page) {
  for (let i = 0; i < 7; i++) {
    await page.evaluate('window.gc()');
  }
}

export async function startBrowser(options: {
  headless?: boolean;
}): Promise<Browser> {
  const args = ['--window-size=1000,800', '--js-flags=--expose-gc'];
  if (options.headless) args.push('--headless=chrome');
  const browser = await chromium.launch({
    args,
    headless: options.headless,
  });
  return browser;
}
