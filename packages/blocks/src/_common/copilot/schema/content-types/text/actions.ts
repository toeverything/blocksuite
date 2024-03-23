import { type ContentPayload, createActionBuilder } from '../../schema.js';
import { chatService, userText } from '../utils.js';

export const createCommonTextAction = createActionBuilder('text')((
  messages: ContentPayload[]
) => {
  return chatService().chat([{ role: 'user', content: messages }]);
});

export const createChangeToneAction = createActionBuilder('text')(({
  input,
  tone,
}: {
  input: string;
  tone: string;
}) => {
  return chatService().chat([
    {
      role: 'system',
      content: 'You are assisting the user in writing high quality content.',
    },
    userText(input),
    userText(
      `Change the tone the of Markdown text to ${tone}, preserving the formatting, like bold, italic, link, highlight. Please be sure to only return the content.`
    ),
  ]);
});

export const createFixSpellingAction = createActionBuilder('text')((payload: {
  input: string;
}) => {
  const { input } = payload;
  return chatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Fix the spelling and grammar of the text, preserving the markdown formatting, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
});

export const createGenerateAction = createActionBuilder('text')((payload: {
  input: string;
}) => {
  const { input } = payload;
  return chatService().chat([
    {
      role: 'system',
      content:
        'You are assisting the user in extending the content of the whiteboard.',
    },
    userText(input),
    userText('Generate more content based on the current input.'),
  ]);
});

export const createImproveWritingAction = createActionBuilder('text')(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
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
);

export const createMakeLongerAction = createActionBuilder('text')((payload: {
  input: string;
}) => {
  const { input } = payload;
  return chatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Make the input text longer, preserving the markdown formatting, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
});

export const createMakeShorterAction = createActionBuilder('text')((payload: {
  input: string;
}) => {
  const { input } = payload;
  return chatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assistant',
    },
    userText(input),
    userText(
      'Make the input text shorter, preserving the markdown formatting, like bold, italic, link, highlight. Make sure to do your best'
    ),
  ]);
});

export const createRefineAction = createActionBuilder('text')((payload: {
  input: string;
}) => {
  const { input } = payload;
  return chatService().chat([
    {
      role: 'system',
      content:
        'You are assisting the user in refining the content of the whiteboard.',
    },
    userText(input),
    userText('Refine this text.'),
  ]);
});

export const createSimplifyWritingAction = createActionBuilder('text')(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
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
);

export const createSummaryAction = createActionBuilder('text')((payload: {
  input: string;
}) => {
  const { input } = payload;
  return chatService().chat([
    {
      role: 'system',
      content: 'You are a professional writing assisting.',
    },
    userText(input),
    userText('Summarize this text. Make sure to do your best.'),
  ]);
});

export const createTranslateAction = createActionBuilder('text')((payload: {
  input: string;
  language: string;
}) => {
  const { input, language } = payload;
  return chatService().chat([
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
});
export const textActions = {
  createChangeToneAction,
  createCommonTextAction,
  createFixSpellingAction,
  createGenerateAction,
  createImproveWritingAction,
  createMakeLongerAction,
  createMakeShorterAction,
  createRefineAction,
  createSimplifyWritingAction,
  createSummaryAction,
  createTranslateAction,
};
