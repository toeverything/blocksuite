export interface TestResult {
  success: boolean;
  messages: string[];
}

const testResult: TestResult = {
  success: true,
  messages: [],
};

const testCases: Promise<boolean>[] = [];

function reportTestResult() {
  const event = new CustomEvent<TestResult>('test-result', {
    detail: testResult,
  });
  window.dispatchEvent(event);
}

function addMessage(message: string) {
  console.log(message);
  testResult.messages.push(message);
}

function reject(message: string) {
  testResult.success = false;
  addMessage(`❌ ${message}`);
}

export async function test(name: string, callback: () => Promise<boolean>) {
  const resultPromise = callback();
  testCases.push(resultPromise);

  const result = await resultPromise;
  if (result) addMessage(`✅ ${name}`);
  else reject(name);
}

export function collectTestResult() {
  Promise.all(testCases).then(reportTestResult);
}

// Test image source: https://en.wikipedia.org/wiki/Test_card
export async function loadTestImageBlob(name: string): Promise<Blob> {
  const resp = await fetch(`/${name}.png`);
  return await resp.blob();
}

export async function loadImage(blobUrl: string) {
  const img = new Image();
  img.src = blobUrl;
  return new Promise<HTMLImageElement>(resolve => {
    img.onload = () => resolve(img);
  });
}

export function assertColor(
  img: HTMLImageElement,
  x: number,
  y: number,
  color: [number, number, number]
): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(x, y, 1, 1).data;
  const r = data[0];
  const g = data[1];
  const b = data[2];
  return r === color[0] && g === color[1] && b === color[2];
}
