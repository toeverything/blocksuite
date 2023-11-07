import { html } from 'lit';

type EmbedConfig = {
  name: string;
  type?: 'iframe' | 'custom';
  format: (url: URL) => string | null;
};

// Ported from https://github.com/toeverything/Ligo-Virgo/tree/field/libs/components/editor-blocks/src/components/source-view/format-url
const embedConfig: EmbedConfig[] = [
  {
    name: 'figma',
    // See https://www.figma.com/developers/embed
    format: url => {
      if (!url.hostname.endsWith('figma.com')) return null;
      const urlStr = url.toString();
      const figmaRegex =
        /https:\/\/([\w.-]+\.)?figma.com\/(file|proto)\/([0-9a-zA-Z]{22,128})(?:\/.*)?$/;
      if (!figmaRegex.test(urlStr)) return null;
      return `https://www.figma.com/embed?embed_host=affine&url=${url}`;
    },
  },
  {
    name: 'youtube',
    // See https://support.google.com/youtube/answer/171780
    format: url => {
      if (
        !['www.youtube.com', 'youtu.be', 'youtube.com'].includes(url.hostname)
      )
        return null;

      const urlStr = url.toString();
      const regexp =
        /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=)([^#&?]*).*/;
      const matched = urlStr.match(regexp);
      if (!matched || matched[1].length !== 11) return null;
      const videoId = matched[1];
      return `https://www.youtube.com/embed/${videoId}`;
    },
  },
  {
    // See also https://publish.twitter.com/
    name: 'X(Twitter) ',
    format: url => {
      if (!['www.twitter.com', 'twitter.com', 'x.com'].includes(url.hostname))
        return null;
      // https://twitter.com/[username]/status/[tweetId]
      const tweetId = url.pathname.match(
        /\/[a-zA-Z0-9_]{1,20}\/status\/([0-9]*)/
      )?.[1];

      if (!tweetId) return null;

      const twitterWidgetJs = 'https://platform.twitter.com/widgets.js';
      // See https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-javascript-factory-function
      const methodName = 'createTweet';
      // See https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference
      const options = {
        // cards: 'hidden',
        width: 698,
        maxWidth: '100%',
        height: 480,
        theme:
          document.documentElement.getAttribute('data-theme') === 'dark'
            ? 'dark'
            : 'light',
        align: 'center',
        // When set to true, the Tweet and its embedded page on your site are not used for purposes
        // that include personalized suggestions and personalized ads.
        dnt: true,
      };

      // Reference to https://github.com/saurabhnemade/react-twitter-embed
      // Licensed under MIT
      const template = html`
        <div id="tweet" style="display: flex; justify-content: center;"></div>
        <script src="${twitterWidgetJs}" charset="utf-8"></script>
        <script>
          (() => {
            if (!window.twttr) {
              console.error('Failure to load window.twttr, aborting load');
              return;
            }
            if (!window.twttr.widgets.${methodName}) {
              console.error(
                'Method ${methodName} is not present anymore in twttr.widget api'
              );
              return;
            }
            window.twttr.widgets.${methodName}(
              '${tweetId}',
              tweet,
              ${JSON.stringify(options)}
            );
          })();
        </script>
      `;

      return (
        'data:text/html;charset=utf-8,' +
        encodeURIComponent(String.raw(template.strings, ...template.values))
      );
    },
  },
];

/**
 * @internal Just export for test
 */
export const formatEmbedUrl = (urlStr: string): string | null => {
  try {
    const url = new URL(urlStr);
    for (const embed of embedConfig) {
      const formattedUrl = embed.format(url);
      if (formattedUrl) {
        return formattedUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const allowEmbed = (urlStr: string) => {
  return !!formatEmbedUrl(urlStr);
};

export const embedIframeTemplate = (url: string) => {
  const embedUrl = formatEmbedUrl(url);
  if (!embedUrl) return null;
  return html`<iframe
    style="width: 100%;"
    height="480"
    scrolling="no"
    src=${embedUrl}
    frameborder="no"
    loading="lazy"
    allowTransparency
    allowfullscreen
  ></iframe>`;
};
