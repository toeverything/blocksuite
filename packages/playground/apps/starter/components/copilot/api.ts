const USE_LOCAL = false;
// const USE_LOCAL = true; // for local debug toggling

const ENDPOINT = USE_LOCAL
  ? 'http://localhost:8787/api/copilot'
  : 'https://copilot-poc.toeverything.workers.dev/api/copilot';

async function sendRequest(inputData: unknown) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inputData),
  });

  if (!response.ok) throw new Error('Invalid network response');
  return response;
}

export async function sendRefineRequest(lines: string[]) {
  const payload = {
    action: 'refine',
    input: lines,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendTranslateRequest(lines: string[]) {
  const payload = {
    action: 'translate',
    input: lines,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendSummaryRequest(lines: string[]) {
  const payload = {
    action: 'summary',
    input: lines,
  };
  const response = await sendRequest(payload);
  return await response.text();
}
