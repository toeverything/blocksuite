const USE_LOCAL = true;
// const USE_LOCAL = true; // for local debug toggling

const ENDPOINT = USE_LOCAL
  ? 'http://localhost:8787/api/copilot'
  : 'https://copilot-poc.toeverything.workers.dev/api/copilot';

export async function sendRequest(inputData: unknown) {
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
