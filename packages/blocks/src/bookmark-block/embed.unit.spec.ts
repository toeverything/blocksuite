import { describe, expect, test } from 'vitest';

import { formatEmbedUrl } from './embed.js';

describe('formatEmbedUrl', () => {
  const exampleFigmaUrl =
    'https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File';

  test('valid figma url', () => {
    expect(formatEmbedUrl(exampleFigmaUrl)).toMatchInlineSnapshot(
      '"https://www.figma.com/embed?embed_host=affine&url=https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File"'
    );
  });

  test('invalid figma url', () => {
    expect(formatEmbedUrl('https://www.figma.com/')).toEqual(null);
    expect(formatEmbedUrl('https://www.figma.com/?file=xxxxx')).toEqual(null);
    expect(formatEmbedUrl(`http://example.com?url=${exampleFigmaUrl}`)).toEqual(
      null
    );

    // https protocol is required!
    expect(formatEmbedUrl(exampleFigmaUrl.replace('https', 'http'))).toEqual(
      null
    );
  });

  test('valid youtube url', () => {
    expect(
      formatEmbedUrl('https://www.youtube.com/watch?v=lJIrF4YjHfQ')
    ).toMatchInlineSnapshot('"https://www.youtube.com/embed/lJIrF4YjHfQ"');

    // With other params
    expect(
      formatEmbedUrl('https://www.youtube.com/watch?v=lJIrF4YjHfQ&t=1s')
    ).toMatchInlineSnapshot('"https://www.youtube.com/embed/lJIrF4YjHfQ"');

    // Short url
    expect(
      formatEmbedUrl('https://youtu.be/lJIrF4YjHfQ&t=1s')
    ).toMatchInlineSnapshot('"https://www.youtube.com/embed/lJIrF4YjHfQ"');

    // Short video
    expect(
      formatEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    ).toMatchInlineSnapshot('"https://www.youtube.com/embed/dQw4w9WgXcQ"');

    // Embed url
    expect(
      formatEmbedUrl(
        formatEmbedUrl('https://www.youtube.com/watch?v=lJIrF4YjHfQ')!
      )
    ).toEqual(formatEmbedUrl('https://www.youtube.com/watch?v=lJIrF4YjHfQ'));

    // http protocol is allowed
    expect(
      formatEmbedUrl('http://www.youtube.com/watch?v=lJIrF4YjHfQ')
    ).toMatchInlineSnapshot('"https://www.youtube.com/embed/lJIrF4YjHfQ"');
  });

  test('invalid youtube url', () => {
    expect(formatEmbedUrl('https://www.youtube.com/')).toEqual(null);
    expect(
      formatEmbedUrl(
        `https://example.com/?url=https://www.youtube.com/watch?v=lJIrF4YjHfQ`
      )
    ).toEqual(null);
  });

  test('misc', () => {
    expect(formatEmbedUrl('')).toEqual(null);
    expect(formatEmbedUrl('1213123')).toEqual(null);

    // Protocol is required!
    expect(formatEmbedUrl('www.youtube.com/watch?v=lJIrF4YjHfQ')).toEqual(null);
  });
});
