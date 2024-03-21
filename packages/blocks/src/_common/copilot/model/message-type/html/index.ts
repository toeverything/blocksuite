import { html } from 'lit';

import { createMessageSchema } from '../../message-schema.js';
import { chatService, image2TextService, userText } from '../utils.js';

type HTML = string;
export const HTMLMessageSchema = createMessageSchema<HTML>({
  type: 'html',
  render: ({ value }) => {
    if (value.status === 'loading') {
      return html`loading...`;
    }
    if (value.status === 'error') {
      return html` <div>${value.message}</div>`;
    }
    let s = value.data;
    const start = s.indexOf('<!DOCTYPE html>');
    if (start >= 0) {
      s = s.slice(start);
    }
    const end = s.indexOf('</html>');
    if (end >= 0) {
      s = s.slice(0, end + '</html>'.length);
    }
    if (!value.done) {
      return html`<div style="white-space: pre-wrap;font-size: 12px">
        ${s}
      </div>`;
    }
    return html` <div>
      <iframe style="width: 100%;border: 0;" srcdoc="${s}"></iframe>
    </div>`;
  },
  toContext: (value: HTML) => {
    return [
      {
        role: 'assistant',
        content: value,
        sources: [],
      },
    ];
  },
});

export const createHTMLFromImageAction = HTMLMessageSchema.createActionBuilder(
  ({
    img,
    latestHtmlBlock,
  }: {
    img: string;
    latestHtmlBlock?: {
      design: string;
      html: string;
    };
  }) => {
    return image2TextService().generateText([
      {
        role: 'system',
        content: `You are an expert web developer who specializes in building working website prototypes from low-fidelity wireframes.
Your job is to accept low-fidelity wireframes, then create a working prototype using HTML, CSS, and JavaScript, and finally send back the results.
The results should be a single HTML file.
Use tailwind to style the website.
Put any additional CSS styles in a style tag and any JavaScript in a script tag.
Use unpkg or skypack to import any required dependencies.
Use Google fonts to pull in any open source fonts you require.
If you have any images, load them from Unsplash or use solid colored rectangles.

The wireframes may include flow charts, diagrams, labels, arrows, sticky notes, and other features that should inform your work.
If there are screenshots or images, use them to inform the colors, fonts, and layout of your website.
Use your best judgement to determine whether what you see should be part of the user interface, or else is just an annotation.

Use what you know about applications and user experience to fill in any implicit business logic in the wireframes. Flesh it out, make it real!

The user may also provide you with the html of a previous design that they want you to iterate from.
In the wireframe, the previous design's html will appear as a white rectangle.
Use their notes, together with the previous design, to inform your next result.

Sometimes it's hard for you to read the writing in the wireframes.
For this reason, all text from the wireframes will be provided to you as a list of strings, separated by newlines.
Use the provided list of text from the wireframes as a reference if any text is hard to read.

You love your designers and want them to be happy. Incorporating their feedback and notes and producing working websites makes them happy.

When sent new wireframes, respond ONLY with the contents of the html file.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              detail: 'high',
              url: img,
            },
          },
          {
            type: 'text',
            text: 'Here are the latest wireframes. Could you make a new website based on these wireframes and notes and send back just the html file?',
          },
          ...(latestHtmlBlock
            ? ([
                {
                  type: 'text',
                  text: "The designs also included one of your previous result. Here's the image that you used as its source:",
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: latestHtmlBlock.design,
                    detail: 'high',
                  },
                },
                {
                  type: 'text',
                  text: `And here's the HTML you came up with for it: ${latestHtmlBlock.html}`,
                },
              ] as const)
            : []),
        ],
      },
    ]);
  }
);

export const createHTMLFromTextAction = HTMLMessageSchema.createActionBuilder(
  (text: string, context) => {
    return chatService().chat([
      ...context.history,
      userText(
        `You are a professional web developer who specializes in building working website prototypes from product requirement descriptions.
Your job is to take a product requirement description, then create a working prototype using HTML, CSS, and JavaScript, and finally send the result back.
The result should be a single HTML file.
Use tailwind to create site styles.
Add CSS styles in the style tag and JavaScript in the script tag.
Import any required dependencies using unpkg or skypack.
Import the required open source fonts using Google Fonts.
If there are any images, load them from Unsplash or use solid color rectangles.

Wireframes may include flowcharts, diagrams, labels, arrows, sticky notes and other features that should inform your work.

Use your knowledge of the application and user experience to fill in any implied business logic in the wireframe diagram. Fill it in and make it real!

Below are the product requirements:
\`\`\`
${text}
\`\`\`

Don't output anything that isn't HTML
`
      ),
    ]);
  }
);
