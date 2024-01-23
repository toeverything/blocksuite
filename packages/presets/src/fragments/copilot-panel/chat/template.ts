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
export type PPTSection = {
  title: string;
  content: string;
  keywords: string;
};
type PageTemplate = {
  images: {
    id: string;
    url: string;
  }[];
  content: unknown;
};
const basic1section = async (
  title: string,
  section: PPTSection
): Promise<PageTemplate> => {
  const template = basic1();
  replaceText(
    {
      'section.title': section.title,
      'section.content': section.content,
    },
    template
  );
  return {
    images: [],
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
      'section1.title': section1.title,
      'section1.content': section1.content,
      'section2.title': section2.title,
      'section2.content': section2.content,
    },
    template
  );
  return {
    images: [],
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
    images: [],
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
    images: [],
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
export const createTemplate = async () => {
  return {
    assets: {
      'vw0gogWhE3OKIh5UtFzL6SwhzlGSHei797vzdqchToY=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'E1ytvXepMy9ae-OrjPvW3Y5xzkU8-O4kbIoOVOwybWU=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      '6SOsneRcB3Tvo5yA9d64vklS8eOalIC09Fmm_pVru4M=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'vIIY5sl-Ft6eM_m9s_ZwNF9TmWfOiQslA_VytsZyah8=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'n-kjXi1dM0J2_CVo5YSqhYoI9NsXVFmfZUROz7rKxpQ=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'HqE2Qsj7kAJ_TmUg1zFoBKudXWvf-_8_YCi8I6VW1uQ=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'MmtizOEJsjxrXjA2C0dxm0oYQo3Pr_hlSn7bm7d6RTU=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'cyxTapcHoMVlgMDcJUWFFaW9Uw4v6-Qgbz7kBxxyqCA=':
        'https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=5071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    content: {
      type: 'page',
      meta: {
        id: 'page:home',
        title: 'BlockSuite Playground',
        createDate: 1705916093723,
        tags: [],
      },
      blocks: {
        type: 'block',
        id: 'block:ANb1orAguh',
        flavour: 'affine:page',
        props: {
          title: {
            '$blocksuite:internal:text$': true,
            delta: [],
          },
        },
        children: [
          {
            type: 'block',
            id: 'block:7pnSJvYn2R',
            flavour: 'affine:surface',
            props: {
              elements: {
                'Kdv4Z-X-Iu': {
                  index: 'a1',
                  seed: 1525437043,
                  xywh: '[421.31215030949335,94.59340240275264,173.95188903808594,43]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'This is Heading',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:BebasNeue',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'Kdv4Z-X-Iu',
                  hasMaxWidth: false,
                },
                zmb4YiICYy: {
                  index: 'a2',
                  seed: 1525437043,
                  xywh: '[421.3121503094935,182.4630313256991,744,240]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'zmb4YiICYy',
                  hasMaxWidth: true,
                },
                A4aOmsUlT4: {
                  index: 'a0',
                  seed: 1481792641,
                  children: {
                    'affine:surface:ymap': true,
                    json: {
                      zmb4YiICYy: true,
                      'Kdv4Z-X-Iu': true,
                      'block:2A5k95mdrf': true,
                    },
                  },
                  title: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'Group 1',
                      },
                    ],
                  },
                  type: 'group',
                  id: 'A4aOmsUlT4',
                  xywh: '[421.31215030949335,94.59340240275264,769.9916487068964,802.9284226918287]',
                },
                QtLGiWqeWE: {
                  index: 'a3',
                  seed: 1525437043,
                  xywh: '[-488.74606390595324,182.4630313256991,744,240]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'QtLGiWqeWE',
                  hasMaxWidth: true,
                },
                z_Fwzv9NFj: {
                  index: 'a4',
                  seed: 1525437043,
                  xywh: '[-488.7460639059533,94.59340240275264,173.95188903808594,43]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'This is Heading',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:BebasNeue',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'z_Fwzv9NFj',
                  hasMaxWidth: false,
                },
                xb0Uf2GiXI: {
                  index: 'a0',
                  seed: 780238216,
                  children: {
                    'affine:surface:ymap': true,
                    json: {
                      QtLGiWqeWE: true,
                      z_Fwzv9NFj: true,
                      'block:Y1Hv2V4GqI': true,
                    },
                  },
                  title: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'Group 2',
                      },
                    ],
                  },
                  type: 'group',
                  id: 'xb0Uf2GiXI',
                  xywh: '[-488.7460639059533,94.59340240275264,769.9916487068964,802.9284226918285]',
                },
                gMx3V4n1OQ: {
                  index: 'a5',
                  seed: 1525437043,
                  xywh: '[1795.5880234835101,140.98292159843865,433.40755240886097,390]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'gMx3V4n1OQ',
                  hasMaxWidth: true,
                },
                xFNYQ2YxAs: {
                  index: 'a6',
                  seed: 1525437043,
                  xywh: '[1795.5880234835101,78.66581093933802,412,45]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'xFNYQ2YxAs',
                  hasMaxWidth: true,
                },
                nYmEV0g7qr: {
                  index: 'a7',
                  seed: 1525437043,
                  xywh: '[2404.2056045448085,508.03857761480265,433,390]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'nYmEV0g7qr',
                  hasMaxWidth: true,
                },
                VCAjr40w7q: {
                  index: 'a8',
                  seed: 1525437043,
                  xywh: '[2404.2056045448085,442.98254915814607,412,45]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'VCAjr40w7q',
                  hasMaxWidth: true,
                },
                '1Eh_vYkKoV': {
                  index: 'a9',
                  seed: 1525437043,
                  xywh: '[3011.8024388325857,140.98292159843868,433,390]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: '1Eh_vYkKoV',
                  hasMaxWidth: true,
                },
                WZAZuSF4b7: {
                  index: 'aA',
                  seed: 1525437043,
                  xywh: '[3011.8024388325857,64.4993267064874,412,45]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'WZAZuSF4b7',
                  hasMaxWidth: true,
                },
                'Ft-caBFZnH': {
                  index: 'aB',
                  seed: 1525437043,
                  xywh: '[388.5832286779395,1939.8328039696826,522.211325940692,45]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'Ft-caBFZnH',
                  hasMaxWidth: true,
                },
                XXpGmR0bSw: {
                  index: 'aC',
                  seed: 1525437043,
                  xywh: '[388.5832286779395,1550.2634880395976,781.4355292553771,120]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'XXpGmR0bSw',
                  hasMaxWidth: true,
                },
                '0eX9P0y7hB': {
                  index: 'aD',
                  seed: 1525437043,
                  xywh: '[-505.3995683737779,1481.4387147330958,522.211325940692,45]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: '0eX9P0y7hB',
                  hasMaxWidth: true,
                },
                '90HCmsdc__': {
                  index: 'aE',
                  seed: 1525437043,
                  xywh: '[-499.8915743229831,1538.0633883765045,334.9504589764057,240]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: '90HCmsdc__',
                  hasMaxWidth: true,
                },
                ymsdCirrYD: {
                  index: 'aF',
                  seed: 1525437043,
                  xywh: '[388.5832286779395,1481.4387147330958,522.211325940692,45]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'ymsdCirrYD',
                  hasMaxWidth: true,
                },
                xGIwi2eQUz: {
                  index: 'aG',
                  seed: 1525437043,
                  xywh: '[388.5832286779395,1707.54814600464,781.4355292553771,120]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'xGIwi2eQUz',
                  hasMaxWidth: true,
                },
                r8XZEcN2jL: {
                  index: 'aH',
                  seed: 1525437043,
                  xywh: '[-499.89157432298305,2182.816235778621,781.4355292553771,120]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'r8XZEcN2jL',
                  hasMaxWidth: true,
                },
                O2td7SlmMs: {
                  index: 'aI',
                  seed: 1525437043,
                  xywh: '[-499.89157432298305,2025.5315778135787,781.4355292553771,120]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'O2td7SlmMs',
                  hasMaxWidth: true,
                },
                J0m8886XKa: {
                  index: 'aJ',
                  seed: 1525437043,
                  xywh: '[-499.89157432298305,1956.7068045070769,522.211325940692,45]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 36,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'J0m8886XKa',
                  hasMaxWidth: true,
                },
                'S-Tv5AFRA9': {
                  index: 'aK',
                  seed: 1525437043,
                  xywh: '[826.4219074079508,2007.6162990740172,334.9504589764057,240]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'S-Tv5AFRA9',
                  hasMaxWidth: true,
                },
                ytooLX8T58: {
                  index: 'aL',
                  seed: 1525437043,
                  xywh: '[2686.2146073931917,1421.7314131274675,657.6488715277778,80]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert: 'As an open-source ',
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 64,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '600',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'ytooLX8T58',
                  hasMaxWidth: true,
                },
                'tm-TdmaZr8': {
                  index: 'aM',
                  seed: 1525437043,
                  xywh: '[2686.2146073931917,1569.4563835151368,826.52509469697,210]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'tm-TdmaZr8',
                  hasMaxWidth: true,
                },
                ECOp2W_cOp: {
                  index: 'aN',
                  seed: 1525437043,
                  xywh: '[2686.2146073931917,1834.8328039696826,826.52509469697,210]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'ECOp2W_cOp',
                  hasMaxWidth: true,
                },
                CzwOWwp5xg: {
                  index: 'aO',
                  seed: 1525437043,
                  xywh: '[2686.2146073931917,2100.209224424228,826.52509469697,210]',
                  rotate: 0,
                  text: {
                    'affine:surface:text': true,
                    delta: [
                      {
                        insert:
                          "As an open-source project that values community engagement AFFiNE looks to work closely with its collaborators - that's why we started the AFFiNE Core Community Contributor program and also offer internship opportunities. If you're interested in contributing to AFFiNE, do visit our GitHub and feel free to get stuck in. If you want to be more involved and have access to our team and industry experts, you may express your interest via the form below to apply for a paid internship position.",
                      },
                    ],
                  },
                  color: '--affine-palette-line-black',
                  fontSize: 24,
                  fontFamily: 'blocksuite:surface:Satoshi',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  textAlign: 'left',
                  type: 'text',
                  id: 'CzwOWwp5xg',
                  hasMaxWidth: true,
                },
              },
            },
            children: [
              {
                type: 'block',
                id: 'block:mYBnDdl3RD',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'vw0gogWhE3OKIh5UtFzL6SwhzlGSHei797vzdqchToY=',
                  width: 0,
                  height: 0,
                  index: 'a0',
                  xywh: '[-527.7393035832009,172.83010745814192,0,0]',
                  rotate: 0,
                  size: 1580584,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:BMcXhl39O4',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'E1ytvXepMy9ae-OrjPvW3Y5xzkU8-O4kbIoOVOwybWU=',
                  width: 1920,
                  height: 1080,
                  index: 'a0',
                  xywh: '[-608.7211324447817,-61.17310922569595,1920,1080]',
                  rotate: 0,
                  size: 58197,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:2A5k95mdrf',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: '6SOsneRcB3Tvo5yA9d64vklS8eOalIC09Fmm_pVru4M=',
                  width: 1582,
                  height: 707,
                  index: 'a0t',
                  xywh: '[421.31215030949335,553.4105130618533,769.9916487068964,344.111312032728]',
                  rotate: 0,
                  size: 1196008,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:Y1Hv2V4GqI',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: '6SOsneRcB3Tvo5yA9d64vklS8eOalIC09Fmm_pVru4M=',
                  width: 0,
                  height: 0,
                  index: 'a0x',
                  xywh: '[-488.7460639059533,553.4105130618532,769.9916487068964,344.111312032728]',
                  rotate: 0,
                  size: -1,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:mDQubluTLC',
                flavour: 'affine:frame',
                props: {
                  title: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Frame 1',
                      },
                    ],
                  },
                  background: '--affine-palette-transparent',
                  xywh: '[-648.7211324447817,-101.17310922569595,2000,1160]',
                  index: 'a0',
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:4GqbS1VKB5',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'vIIY5sl-Ft6eM_m9s_ZwNF9TmWfOiQslA_VytsZyah8=',
                  width: 1920,
                  height: 1080,
                  index: 'a1',
                  xywh: '[1660.909380749239,-66.36997771474762,1920,1080]',
                  rotate: 0,
                  size: 62777,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:OaxgBGd3r7',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'n-kjXi1dM0J2_CVo5YSqhYoI9NsXVFmfZUROz7rKxpQ=',
                  width: 954,
                  height: 707,
                  index: 'a2',
                  xywh: '[1796.608770257032,562.3231166227331,432.38680563533944,320.43760124128437]',
                  rotate: 0,
                  size: 781251,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:NU43uDZ9MS',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'n-kjXi1dM0J2_CVo5YSqhYoI9NsXVFmfZUROz7rKxpQ=',
                  width: 0,
                  height: 0,
                  index: 'a2V',
                  xywh: '[2404.2056045448085,72.16581093933802,432.38680563533944,320.43760124128437]',
                  rotate: 0,
                  size: -1,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:IL_-NnXjtS',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'n-kjXi1dM0J2_CVo5YSqhYoI9NsXVFmfZUROz7rKxpQ=',
                  width: 0,
                  height: 0,
                  index: 'a2l',
                  xywh: '[3012.823185606107,562.3231166227331,432.38680563533944,320.43760124128437]',
                  rotate: 0,
                  size: -1,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:ZAOv_3QDkv',
                flavour: 'affine:frame',
                props: {
                  title: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Frame 2',
                      },
                    ],
                  },
                  background: '--affine-palette-transparent',
                  xywh: '[1620.909380749239,-106.36997771474762,2000,1160]',
                  index: 'a1',
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:AcWEhQpQVD',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'HqE2Qsj7kAJ_TmUg1zFoBKudXWvf-_8_YCi8I6VW1uQ=',
                  width: 1920,
                  height: 1080,
                  index: 'a2t',
                  xywh: '[-629.2596039693133,1358.927978154552,1920,1080]',
                  rotate: 0,
                  size: 65210,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:mang0-VqkP',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'n-kjXi1dM0J2_CVo5YSqhYoI9NsXVFmfZUROz7rKxpQ=',
                  width: 0,
                  height: 0,
                  index: 'a2x',
                  xywh: '[-143.41209158138275,1538.0633883765045,420.33672915650914,311.50740829523306]',
                  rotate: 0,
                  size: -1,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:9CvRaMmv3S',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'n-kjXi1dM0J2_CVo5YSqhYoI9NsXVFmfZUROz7rKxpQ=',
                  width: 0,
                  height: 0,
                  index: 'a2zV',
                  xywh: '[388.5832286779395,2007.6162990740172,416.68472298005537,308.80094250199113]',
                  rotate: 0,
                  size: -1,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:mi0spSVMUW',
                flavour: 'affine:frame',
                props: {
                  title: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Frame 3',
                      },
                    ],
                  },
                  background: '--affine-palette-transparent',
                  xywh: '[-669.2596039693133,1318.927978154552,2000,1160]',
                  index: 'a2',
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:H0sHH_XQcy',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'MmtizOEJsjxrXjA2C0dxm0oYQo3Pr_hlSn7bm7d6RTU=',
                  width: 1920,
                  height: 1080,
                  index: 'a2zl',
                  xywh: '[1650.2056045448085,1358.927978154552,1920,1080]',
                  rotate: 0,
                  size: 32476,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:h5D4krr5VV',
                flavour: 'affine:image',
                props: {
                  caption: '',
                  sourceId: 'cyxTapcHoMVlgMDcJUWFFaW9Uw4v6-Qgbz7kBxxyqCA=',
                  width: 1582,
                  height: 1782,
                  index: 'a2zt',
                  xywh: '[1683.0608807165258,1388.596209788303,907.969153338945,1022.756656921618]',
                  rotate: 0,
                  size: 2426004,
                },
                children: [],
              },
              {
                type: 'block',
                id: 'block:OKpCd8J6UI',
                flavour: 'affine:frame',
                props: {
                  title: {
                    '$blocksuite:internal:text$': true,
                    delta: [
                      {
                        insert: 'Frame 4',
                      },
                    ],
                  },
                  background: '--affine-palette-transparent',
                  xywh: '[1610.2056045448085,1318.927978154552,2000,1160]',
                  index: 'a3',
                },
                children: [],
              },
            ],
          },
        ],
      },
    },
  };
};
