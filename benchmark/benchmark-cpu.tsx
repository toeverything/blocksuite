import { forceGC, previewURL, startBrowser } from './common';
import { computeResultsCPU } from './timeline';

export async function runCPUBenchmark() {
  const browser = await startBrowser({ headless: true });
  const page = await browser.newPage();
  const client = await page.context().newCDPSession(page);

  const tmpTraceFile = './tmp/trace.json';

  const durations: number[] = [];

  for (let i = 0; i < 10; i++) {
    console.log('CPU benchmark run ' + i);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 16 });
    await forceGC(page);
    const categories = [
      'blink.user_timing',
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
    ];
    await browser.startTracing(page, {
      path: tmpTraceFile,
      screenshots: false,
      categories: categories,
    });
    await page.goto(previewURL + '?init=preset');
    const pageTitle = page.locator(
      '.affine-default-page-block-title >> text="Welcome to BlockSuite playground"'
    );
    await pageTitle.isVisible();
    await browser.stopTracing();
    const duration = await computeResultsCPU(tmpTraceFile);
    durations.push(duration);
  }

  const sum = durations.reduce((a, b) => a + b, 0);
  durations.sort((a, b) => a - b);
  const avg = sum / durations.length || 0;
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const median = durations[Math.floor(durations.length / 2)];

  console.log('CPU benchmark result:', {
    avg,
    max,
    min,
    median,
  });

  await browser.close();
}
