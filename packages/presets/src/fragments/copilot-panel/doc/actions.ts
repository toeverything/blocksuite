import { getChatService, userText } from './api.js';

export function runChangeToneAction({
  input,
  tone,
}: {
  input: string;
  tone: string;
}) {
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are assisting the user in writing high quality content.',
    },
    userText(input),
    userText(
      `Change the tone the of Markdown text to ${tone}, preserving the formatting, like bold, italic, link, highlight. Please be sure to only return the content.`
    ),
  ]);
}

export function runFixSpellingAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Fix the spelling and grammar of the text, preserving the markdown formatting, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
}

export function runGenerateAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content:
        'You are assisting the user in extending the content of the whiteboard.',
    },
    userText(input),
    userText('Generate more content based on the current input.'),
  ]);
}

export function runImproveWritingAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Improve the writing of the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
}

export function runMakeLongerAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Make the input text longer, preserving the markdown formatting, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
}

export function runMakeShorterAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Make the input text shorter, preserving the markdown formatting, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
}

export function runRefineAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content:
        'You are assisting the user in refining the content of the whiteboard.',
    },
    userText(input),
    userText('Refine this text.'),
  ]);
}

export function runSimplifyWritingAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Simplify the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
}

export function runSummaryAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting.',
    },
    userText(input),
    userText('Summarize this text. Make sure to do your best.'),
  ]);
}

export function runTranslateAction(payload: {
  input: string;
  language: string;
}) {
  const { input, language } = payload;
  return getChatService().chat([
    {
      role: 'system',
      content: 'You are assisting the user in translating the content.',
    },
    userText(
      `Translate the Markdown text
      
      ${input}
      
      to ${language} while preserving the formatting, like bold, italic, link, highlight. Please only return the result of the translate.`
    ),
  ]);
}

export function runAnalysisAction(payload: { input: string }) {
  const { input } = payload;
  return getChatService().chat([
    userText(
      `Use the nested unordered list syntax in Markdown to create a structure similar to a mind map. 
      Analyze the following questions:
      ${input}`
    ),
  ]);
}

export function runPartAnalysisAction(payload: {
  input: string;
  path: string[];
}) {
  const { input, path } = payload;
  return getChatService().chat([
    userText(
      `The following is a small part of a mind map. You need to use the markdown unordered list starts with \`-\` nesting syntax to analyze the issue in a structure similar to the mind map. Only output the supplementary content starting from the issue node; do not output any additional content.Do not output nodes that already exist in path.
Issue Path:
${path.join('->')}
Issue Node:
${input}`
    ),
  ]);
}
export const runPPTGenerateAction = (payload: { input: string }) => {
  const { input } = payload;
  return getChatService().chat([
    userText(
      `
I want to write a PPT, that has many pages, each page has 1 to 4 sections,
each section has a title of no more than 30 words and no more than 500 words of content,
but also need some keywords that match the content of the paragraph used to generate images,
Try to have a different number of section per page
The first page is the cover, which generates a general title (no more than 4 words) and description based on the topic
this is a template:
- page name
  - title
    - keywords
    - description
- page name
  - section name
    - keywords
    - content
  - section name
    - keywords
    - content
- page name
  - section name
    - keywords
    - content
  - section name
    - keywords
    - content
  - section name
    - keywords
    - content
- page name
  - section name
    - keywords
    - content
  - section name
    - keywords
    - content
  - section name
    - keywords
    - content
  - section name
    - keywords
    - content
- page name
  - section name
    - keywords
    - content


please help me to write this ppt, do not output any content that does not belong to the slides content itself outside of the content, Directly output the title content keywords without prefix like Title:xxx, Content: xxx, Keywords: xxx
The PPT is based on the following topics:
${input}`
    ),
  ]);
};
