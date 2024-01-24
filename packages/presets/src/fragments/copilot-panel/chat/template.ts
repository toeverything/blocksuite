import { Bound } from '@blocksuite/blocks';
import { nanoid } from '@blocksuite/store';

import { basic1 } from './templates/basic1.js';
import { basic2 } from './templates/basic2.js';
import { basic3 } from './templates/basic3.js';
import { basic4 } from './templates/basic4.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const replaceText = (text: Record<string, string>, template: any) => {
  if (template != null && typeof template === 'object') {
    if (Array.isArray(template)) {
      template.forEach(v => replaceText(text, v));
      return;
    }
    if (typeof template.insert === 'string') {
      template.insert = text[template.insert] ?? template.insert;
    }
    Object.values(template).forEach(v => replaceText(text, v));
    return;
  }
};
const getImages = async (
  keywords: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any
): Promise<TemplateImage[]> => {
  const imgs: Record<
    string,
    {
      id: string;
      width: number;
      height: number;
    }
  > = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = (data: any) => {
    if (data != null && typeof data === 'object') {
      if (Array.isArray(data)) {
        data.forEach(v => run(v));
        return;
      }
      if (typeof data.caption === 'string') {
        const bound = Bound.deserialize(data.xywh);
        const id = nanoid();
        data.sourceId = id;
        imgs[data.caption] = {
          id: id,
          width: bound.w,
          height: bound.h,
        };
      }
      Object.values(data).forEach(v => run(v));
      return;
    }
  };
  run(template);
  const list = await Promise.all(
    Object.entries(imgs).map(async ([name, data]) => {
      const keyword = keywords[name];
      if (!keyword) {
        return;
      }
      const url = new URL('https://api.unsplash.com/search/photos');
      const params = new URLSearchParams(window.location.search);
      const unsplashKey = params.get('unsplashKey');
      url.searchParams.set('client_id', unsplashKey ?? '');
      url.searchParams.set('query', keyword);
      const result: { results: { urls: { regular: string } }[] } = await fetch(
        url.toString()
      ).then(res => res.json());
      const randomImage =
        result.results[Math.floor(Math.random() * result.results.length)].urls
          .regular;
      const image = new URL(randomImage);
      image.searchParams.set('fit', 'crop');
      image.searchParams.set('crop', 'edges');
      image.searchParams.set('dpr', '3');
      image.searchParams.set('w', `${data.width}`);
      image.searchParams.set('height', `${data.height}`);
      return {
        id: data.id,
        url: image.toString(),
      } satisfies TemplateImage;
    })
  );
  const notNull = (v?: TemplateImage): v is TemplateImage => {
    return v != null;
  };
  return list.filter(notNull);
};
export type PPTSection = {
  title: string;
  content: string;
  keywords: string;
};
type TemplateImage = {
  id: string;
  url: string;
};
type PageTemplate = {
  images: TemplateImage[];
  content: unknown;
};
const basic1section = async (
  title: string,
  section1: PPTSection
): Promise<PageTemplate> => {
  const template = basic1();
  replaceText(
    {
      title: title,
      'section1.title': section1.title,
      'section1.content': section1.content,
    },
    template
  );
  return {
    images: await getImages({ 'section1.image': section1.keywords }, template),
    content: template,
  };
};
const basic2section = async (
  title: string,
  section1: PPTSection,
  section2: PPTSection
): Promise<PageTemplate> => {
  const template = basic2();
  replaceText(
    {
      title: title,
      'section1.title': section1.title,
      'section1.content': section1.content,
      'section2.title': section2.title,
      'section2.content': section2.content,
    },
    template
  );
  return {
    images: await getImages(
      {
        'section1.image': section1.keywords,
        'section2.image': section2.keywords,
      },
      template
    ),
    content: template,
  };
};
const basic3section = async (
  title: string,
  section1: PPTSection,
  section2: PPTSection,
  section3: PPTSection
): Promise<PageTemplate> => {
  const template = basic3();
  replaceText(
    {
      title: title,
      'section1.title': section1.title,
      'section1.content': section1.content,
      'section2.title': section2.title,
      'section2.content': section2.content,
      'section3.title': section3.title,
      'section3.content': section3.content,
    },
    template
  );
  return {
    images: await getImages(
      {
        'section1.image': section1.keywords,
        'section2.image': section2.keywords,
        'section3.image': section3.keywords,
      },
      template
    ),
    content: template,
  };
};
const basic4section = async (
  title: string,
  section1: PPTSection,
  section2: PPTSection,
  section3: PPTSection,
  section4: PPTSection
): Promise<PageTemplate> => {
  const template = basic4();
  replaceText(
    {
      title: title,
      'section1.title': section1.title,
      'section1.content': section1.content,
      'section2.title': section2.title,
      'section2.content': section2.content,
      'section3.title': section3.title,
      'section3.content': section3.content,
      'section4.title': section4.title,
      'section4.content': section4.content,
    },
    template
  );
  return {
    images: await getImages(
      {
        'section1.image': section1.keywords,
        'section2.image': section2.keywords,
        'section3.image': section3.keywords,
        'section4.image': section4.keywords,
      },
      template
    ),
    content: template,
  };
};
export type PPTPage = {
  title: string;
  sections: PPTSection[];
};
export const basicTheme = (page: PPTPage) => {
  if (page.sections.length === 1) {
    return basic1section(page.title, page.sections[0]);
  }
  if (page.sections.length === 2) {
    return basic2section(page.title, page.sections[0], page.sections[1]);
  }
  if (page.sections.length === 3) {
    return basic3section(
      page.title,
      page.sections[0],
      page.sections[1],
      page.sections[2]
    );
  }
  return basic4section(
    page.title,
    page.sections[0],
    page.sections[1],
    page.sections[2],
    page.sections[3]
  );
};
