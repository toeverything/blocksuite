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
