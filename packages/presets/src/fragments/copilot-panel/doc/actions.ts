import { getChatService, userText } from './api.js';

export async function runChangeToneAction({
  input,
  tone,
}: {
  input: string;
  tone: string;
}) {
  const result = await getChatService().chat([
    {
      role: 'system',
      content: 'You are assisting the user in writing high quality content.',
    },
    userText(input),
    userText(
      `Change the tone the of Markdown text to ${tone}, preserving the formatting, like bold, italic, link, highlight. Please be sure to only return the content.`
    ),
  ]);
  return result;
}

export async function runFixSpellingAction(payload: { input: string }) {
  const { input } = payload;
  const result = await getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Fix the spelling and grammar of the text, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);
  return result;
}

export async function runGenerateAction(payload: { input: string }) {
  const { input } = payload;
  const result = await getChatService().chat([
    {
      role: 'system',
      content:
        'You are assisting the user in extending the content of the whiteboard.',
    },
    userText(input),
    userText('Generate more content based on the current input.'),
  ]);
  return result;
}

export async function runImproveWritingAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Improve the writing of the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);
  return completion;
}

export async function runMakeLongerAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Make the input text longer, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);
  return completion;
}

export async function runMakeShorterAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Make the input text shorter, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);

  return completion;
}

export async function runRefineAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content:
        'You are assisting the user in refining the content of the whiteboard.',
    },
    userText(input),
    userText('Refine this text.'),
  ]);

  return completion;
}

export async function runSimplifyWritingAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting',
    },
    userText(input),
    userText(
      'Simplify the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best'
    ),
  ]);

  return completion;
}

export async function runSummaryAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting.',
    },
    userText(input),
    userText('Summarize this text. To make sure do your best.'),
  ]);

  return completion;
}

export async function runTranslateAction(payload: {
  input: string;
  language: string;
}) {
  const { input, language } = payload;
  const completion = await getChatService().chat([
    {
      role: 'system',
      content: 'You are assisting the user in translating the content.',
    },
    userText(
      `Translate the Markdown text
      
      ${input}
      
      to ${language} while preserving the formatting, like bold, italic, link, highlight. Please only return the result of translate.`
    ),
  ]);

  return completion;
}

export async function runAnalysisAction(payload: { input: string }) {
  const { input } = payload;
  const completion = await getChatService().chat([
    userText(
      `Use the nested unordered list syntax in Markdown to create a structure similar to a mind map. 
      Analysis the following questions:
      ${input}`
    ),
  ]);

  return completion;
}

export async function runPartAnalysisAction(payload: {
  input: string;
  path: string[];
}) {
  const { input, path } = payload;
  const completion = await getChatService().chat([
    userText(
      `The following is a small part of a mind map. You need to use the markdown unordered list nesting syntax to analyze the issue in a structure similar to the mind map. Only output the supplementary content starting from the issue node; do not output any additional content.Do not output nodes that already exist in path.
Issue Path:
${[...path, input].join('->')}
Issue Node:
${input}`
    ),
  ]);

  return completion;
}
