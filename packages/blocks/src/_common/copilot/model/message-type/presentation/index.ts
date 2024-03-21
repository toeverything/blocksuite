import { html } from 'lit';

import { createMessageSchema } from '../../message-schema.js';
import { chatService, userText } from '../utils.js';

type Markdown = string;
export const PresentationMessageSchema = createMessageSchema<Markdown>({
  type: 'presentation',
  render: ({ value }) => {
    if (value.status === 'loading') {
      return html`loading...`;
    }
    if (value.status === 'error') {
      return html` <div>${value.message}</div>`;
    }
    return html` <div style="white-space: pre-wrap">${value.data}</div>`;
  },
  toContext: (value: Markdown) => {
    return [
      {
        role: 'assistant',
        content: value,
        sources: [],
      },
    ];
  },
});

export const createPresentationAction =
  PresentationMessageSchema.createActionBuilder(
    (payload: { input: string }) => {
      const { input } = payload;
      return chatService().chat([
        userText(
          `
I want to write a slides, that has many pages, each page has 1 to 4 sections,
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
    }
  );
