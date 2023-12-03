import type { BookmarkBlockComponent } from './bookmark-block.js';
import type { BookmarkBlockUrlData } from './bookmark-model.js';

async function queryUrlData(url: string): Promise<BookmarkBlockUrlData> {
  if (
    (url.startsWith('https://x.com/') ||
      url.startsWith('https://www.x.com/') ||
      url.startsWith('https://www.twitter.com/') ||
      url.startsWith('https://twitter.com/')) &&
    url.includes('/status/')
  ) {
    // use api.fxtwitter.com
    url = 'https://api.fxtwitter.com/status/' + /\/status\/(.*)/.exec(url)?.[1];
    try {
      const { tweet } = await fetch(url).then(res => res.json());
      return {
        title: tweet.author.name,
        icon: tweet.author.avatar_url,
        description: tweet.text,
        image: tweet.media?.photos[0].url || tweet.author.banner_url,
      };
    } catch (err) {
      console.error('getBookmarkDataByLink', err);
      return {};
    }
  } else {
    return {};

    //TODO: use cloudflare worker to get link preview
    // const previewData = await getLinkPreview(url, {
    //   timeout: 6000,
    //   headers: {
    //     'User-Agent':
    //       'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    //   },
    //   followRedirects: 'follow',
    // });

    // return {
    //   title: 'title' in previewData ? previewData.title : undefined,
    //   description:
    //     'description' in previewData ? previewData.description : undefined,
    //   icon: previewData.favicons[0],
    //   image: 'images' in previewData ? previewData.images[0] : undefined,
    // };
  }
}

// Result is boolean used to record whether the meta data is crawled
export async function refreshBookmarkUrlData(
  bookmarkElement: BookmarkBlockComponent
) {
  bookmarkElement.loading = true;

  const metaData = await queryUrlData(bookmarkElement.model.url);

  const { title, description, icon, image } = metaData;
  bookmarkElement.page.updateBlock(bookmarkElement.model, {
    description,
    icon,
    image,
    title,
  });

  bookmarkElement.loading = false;
}
