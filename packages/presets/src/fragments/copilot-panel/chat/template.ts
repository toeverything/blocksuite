import { Bound } from '@blocksuite/blocks';
import { nanoid } from '@blocksuite/store';

import { basicCover } from './templates/basic-cover.js';
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
const getImageUrlByKeyword =
  (keyword: string) =>
  async (w: number, h: number): Promise<string> => {
    const url = new URL('https://api.unsplash.com/search/photos');
    const params = new URLSearchParams(window.location.search);
    const unsplashKey = params.get('unsplashKey');
    url.searchParams.set('client_id', unsplashKey ?? '');
    url.searchParams.set('query', keyword);
    const result: {
      results: {
        urls: {
          regular: string;
        };
      }[];
    } = await fetch(url.toString()).then(res => res.json());
    const randomImage =
      result.results[Math.floor(Math.random() * result.results.length)].urls
        .regular;
    const image = new URL(randomImage);
    image.searchParams.set('fit', 'crop');
    image.searchParams.set('crop', 'edges');
    image.searchParams.set('dpr', '3');
    image.searchParams.set('w', `${w}`);
    image.searchParams.set('height', `${h}`);
    return image.toString();
  };
const getImages = async (
  images: Record<string, (w: number, h: number) => Promise<string> | string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  template: any
): Promise<TemplateImage[]> => {
  const imgs: Record<
    string,
    {
      height: number;
      id: string;
      width: number;
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
          height: bound.h,
          id: id,
          width: bound.w,
        };
      }
      Object.values(data).forEach(v => run(v));
      return;
    }
  };
  run(template);
  const list = await Promise.all(
    Object.entries(imgs).map(async ([name, data]) => {
      const getImage = images[name];
      if (!getImage) {
        return;
      }
      return {
        id: data.id,
        url: await getImage(data.width, data.height),
      } satisfies TemplateImage;
    })
  );
  const notNull = (v?: TemplateImage): v is TemplateImage => {
    return v != null;
  };
  return list.filter(notNull);
};
export type PPTSection = {
  content: string;
  keywords: string;
  title: string;
};
type TemplateImage = {
  id: string;
  url: string;
};
type DocTemplate = {
  content: unknown;
  images: TemplateImage[];
};
const createBasicCover = async (
  title: string,
  section1: PPTSection
): Promise<DocTemplate> => {
  const template = basicCover();
  replaceText(
    {
      'section1.content': section1.content,
      'section1.title': section1.title,
      title: title,
    },
    template
  );
  return {
    content: template,
    images: await getImages(
      {
        background: () =>
          'https://cdn.affine.pro/ppt-images/background/basic_cover_background.png',
        'section1.image': getImageUrlByKeyword(section1.keywords),
      },
      template
    ),
  };
};
const basic1section = async (
  title: string,
  section1: PPTSection
): Promise<DocTemplate> => {
  const template = basic1();
  replaceText(
    {
      'section1.content': section1.content,
      'section1.title': section1.title,
      title: title,
    },
    template
  );
  return {
    content: template,
    images: await getImages(
      {
        background: () =>
          'https://cdn.affine.pro/ppt-images/background/basic_1_selection_background.png',
        'section1.image': getImageUrlByKeyword(section1.keywords),
      },
      template
    ),
  };
};
const basic2section = async (
  title: string,
  section1: PPTSection,
  section2: PPTSection
): Promise<DocTemplate> => {
  const template = basic2();
  replaceText(
    {
      'section1.content': section1.content,
      'section1.title': section1.title,
      'section2.content': section2.content,
      'section2.title': section2.title,
      title: title,
    },
    template
  );
  return {
    content: template,
    images: await getImages(
      {
        background: () =>
          'https://cdn.affine.pro/ppt-images/background/basic_2_selection_background.png',
        'section1.image': getImageUrlByKeyword(section1.keywords),
        'section2.image': getImageUrlByKeyword(section2.keywords),
      },
      template
    ),
  };
};
const basic3section = async (
  title: string,
  section1: PPTSection,
  section2: PPTSection,
  section3: PPTSection
): Promise<DocTemplate> => {
  const template = basic3();
  replaceText(
    {
      'section1.content': section1.content,
      'section1.title': section1.title,
      'section2.content': section2.content,
      'section2.title': section2.title,
      'section3.content': section3.content,
      'section3.title': section3.title,
      title: title,
    },
    template
  );
  return {
    content: template,
    images: await getImages(
      {
        background: () =>
          'https://cdn.affine.pro/ppt-images/background/basic_3_selection_background.png',
        'section1.image': getImageUrlByKeyword(section1.keywords),
        'section2.image': getImageUrlByKeyword(section2.keywords),
        'section3.image': getImageUrlByKeyword(section3.keywords),
      },
      template
    ),
  };
};
const basic4section = async (
  title: string,
  section1: PPTSection,
  section2: PPTSection,
  section3: PPTSection,
  section4: PPTSection
): Promise<DocTemplate> => {
  const template = basic4();
  replaceText(
    {
      'section1.content': section1.content,
      'section1.title': section1.title,
      'section2.content': section2.content,
      'section2.title': section2.title,
      'section3.content': section3.content,
      'section3.title': section3.title,
      'section4.content': section4.content,
      'section4.title': section4.title,
      title: title,
    },
    template
  );
  return {
    content: template,
    images: await getImages(
      {
        background: () =>
          'https://cdn.affine.pro/ppt-images/background/basic_4_selection_background.png',
        'section1.image': getImageUrlByKeyword(section1.keywords),
        'section2.image': getImageUrlByKeyword(section2.keywords),
        'section3.image': getImageUrlByKeyword(section3.keywords),
        'section4.image': getImageUrlByKeyword(section4.keywords),
      },
      template
    ),
  };
};
export type PPTDoc = {
  isCover: boolean;
  sections: PPTSection[];
  title: string;
};
export const basicTheme = (doc: PPTDoc) => {
  if (doc.isCover) {
    return createBasicCover(doc.title, doc.sections[0]);
  }
  if (doc.sections.length === 1) {
    return basic1section(doc.title, doc.sections[0]);
  }
  if (doc.sections.length === 2) {
    return basic2section(doc.title, doc.sections[0], doc.sections[1]);
  }
  if (doc.sections.length === 3) {
    return basic3section(
      doc.title,
      doc.sections[0],
      doc.sections[1],
      doc.sections[2]
    );
  }
  return basic4section(
    doc.title,
    doc.sections[0],
    doc.sections[1],
    doc.sections[2],
    doc.sections[3]
  );
};
