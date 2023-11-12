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

export async function sendRefineRequest(text: string) {
  const payload = {
    action: 'refine',
    input: text,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendTranslateRequest(text: string, language: string) {
  const payload = {
    action: 'translate',
    input: text,
    language,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendSummaryRequest(text: string) {
  const payload = {
    action: 'summary',
    input: text,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendImproveWritingRequest(text: string) {
  const payload = {
    action: 'improveWriting',
    input: text,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendFixSpellingRequest(text: string) {
  const payload = {
    action: 'fixSpelling',
    input: text,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendSimplifyLanguageRequest(text: string) {
  const payload = {
    action: 'simplifyLanguage',
    input: text,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendMakeLongerRequest(text: string) {
  const payload = {
    action: 'summary',
    input: text,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendMakeShorterRequest(text: string) {
  const payload = {
    action: 'summary',
    input: text,
  };
  const response = await sendRequest(payload);
  return await response.text();
}

export async function sendChangeToneRequest(text: string, tone: string) {
  const payload = {
    action: 'changeTone',
    input: text,
    tone,
  };
  const response = await sendRequest(payload);
  return await response.text();
}
