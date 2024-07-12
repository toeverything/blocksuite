import { Bound } from '@blocksuite/blocks';
import { nanoid } from '@blocksuite/store';

import { AIProvider } from '../provider.js';

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

function seededRNG(seed: string) {
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  const seededNumber = stringToNumber(seed);
  return ((a * seededNumber + c) % m) / m;

  function stringToNumber(str: string) {
    let res = 0;
    for (let i = 0; i < str.length; i++) {
      const character = str.charCodeAt(i);
      res += character;
    }
    return res;
  }
}

const getImageUrlByKeyword =
  (keyword: string) =>
  async (w: number, h: number): Promise<string> => {
    const photos = await AIProvider.photoEngine?.searchImages({
      height: h,
      query: keyword,
      width: w,
    });

    if (photos == null || photos.length === 0) {
      return ''; // fixme: give a default image
    }

    // use a stable random seed
    const rng = seededRNG(`${w}.${h}.${keyword}`);
    return photos[Math.floor(rng * photos.length)];
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
        delete data.caption;
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
      const url = await getImage(data.width, data.height);
      return {
        id: data.id,
        url,
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

export type TemplateImage = {
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
  const templates = (await import('./templates/cover.json')).default;
  const template = getRandomElement(templates);
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
        'section1.image': getImageUrlByKeyword(section1.keywords),
      },
      template
    ),
  };
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const basic1section = async (
  title: string,
  section1: PPTSection
): Promise<DocTemplate> => {
  const templates = (await import('./templates/one.json')).default;
  const template = getRandomElement(templates);
  replaceText(
    {
      'section1.content': section1.content,
      'section1.title': section1.title,
      title: title,
    },
    template
  );
  const images = await getImages(
    {
      'section1.image': getImageUrlByKeyword(section1.keywords),
      'section1.image2': getImageUrlByKeyword(section1.keywords),
      'section1.image3': getImageUrlByKeyword(section1.keywords),
    },
    template
  );

  return {
    content: template,
    images: images,
  };
};

const basic2section = async (
  title: string,
  section1: PPTSection,
  section2: PPTSection
): Promise<DocTemplate> => {
  const templates = (await import('./templates/two.json')).default;
  const template = getRandomElement(templates);
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
  const templates = (await import('./templates/three.json')).default;
  const template = getRandomElement(templates);
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
  const templates = (await import('./templates/four.json')).default;
  const template = getRandomElement(templates);
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
