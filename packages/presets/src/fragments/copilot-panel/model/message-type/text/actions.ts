import { chatService, userText } from '../utils.js';
import { TextMessageSchema } from './index.js';

export const runCommonAction = TextMessageSchema.createActionBuilder(
  (text: string, context) => {
    return chatService().chat([...context.history, userText(text)]);
  }
);
export const runChangeToneAction = TextMessageSchema.createActionBuilder(
  ({ input, tone }: { input: string; tone: string }) => {
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
  }
);

export const runFixSpellingAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
      {
        role: 'system',
        content: 'You are a professional writing assisting',
      },
      userText(input),
      userText(
        'Fix the spelling and grammar of the text, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
      ),
    ]);
  }
);

export const runGenerateAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
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
  }
);

export const runImproveWritingAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
      {
        role: 'system',
        content: 'You are a professional writing assisting',
      },
      userText(input),
      userText(
        'Improve the writing of the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best'
      ),
    ]);
  }
);

export const runMakeLongerAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
      {
        role: 'system',
        content: 'You are a professional writing assisting',
      },
      userText(input),
      userText(
        'Make the input text longer, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
      ),
    ]);
  }
);

export const runMakeShorterAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
      {
        role: 'system',
        content: 'You are a professional writing assisting',
      },
      userText(input),
      userText(
        'Make the input text shorter, preserving the markdown formatting, like bold, italic, link, highlight. To make sure do your best'
      ),
    ]);
  }
);

export const runRefineAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
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
  }
);

export const runSimplifyWritingAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
      {
        role: 'system',
        content: 'You are a professional writing assisting',
      },
      userText(input),
      userText(
        'Simplify the text, preserving the markdown formatting if needed, like bold, italic, link, highlight. To make sure do your best'
      ),
    ]);
  }
);

export const runSummaryAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string }) => {
    const { input } = payload;
    return chatService().chat([
      {
        role: 'system',
        content: 'You are a professional writing assisting.',
      },
      userText(input),
      userText('Summarize this text. To make sure do your best.'),
    ]);
  }
);

export const runTranslateAction = TextMessageSchema.createActionBuilder(
  (payload: { input: string; language: string }) => {
    const { input, language } = payload;
    return chatService().chat([
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
  }
);
