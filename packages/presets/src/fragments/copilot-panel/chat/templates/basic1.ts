export const basic1 = () => ({
  type: 'page',
  meta: {
    id: 'page:home',
    title: '1 selection page',
    createDate: 1706097783488,
    tags: [],
  },
  blocks: {
    type: 'block',
    id: 'YFvUi7KkuC',
    flavour: 'affine:page',
    version: 2,
    props: {
      title: {
        '$blocksuite:internal:text$': true,
        delta: [
          {
            insert: '1 selection page',
          },
        ],
      },
    },
    children: [
      {
        type: 'block',
        id: 'HuKlzlvzfc',
        flavour: 'affine:surface',
        version: 5,
        props: {
          elements: {
            lGcs_jsyUu: {
              index: 'a3',
              seed: 1511317069,
              xywh: '[494.5850414188134,467.3532626441229,600.2879180908203,45]',
              rotate: 0,
              text: {
                'affine:surface:text': true,
                delta: [
                  {
                    insert: 'section1.title',
                  },
                ],
              },
              color: '--affine-palette-line-black',
              fontSize: 32,
              fontFamily: 'blocksuite:surface:Poppins',
              fontWeight: '400',
              fontStyle: 'normal',
              textAlign: 'left',
              type: 'text',
              id: 'lGcs_jsyUu',
              hasMaxWidth: false,
            },
          },
        },
        children: [
          {
            type: 'block',
            id: 'VNRad1g5Yq',
            flavour: 'affine:image',
            version: 1,
            props: {
              caption: 'background',
              sourceId: 'XamwYpascMyEqswjDmd2fmi6DptZM2sLh8wYFW75YQ4=',
              width: 1920,
              height: 1080,
              index: 'a0',
              xywh: '[-568.1241179435484,262.4769405241935,1920,1080]',
              rotate: 0,
              size: 45907,
            },
            children: [],
          },
          {
            type: 'block',
            id: '6kvS_Zg5rg',
            flavour: 'affine:image',
            version: 1,
            props: {
              caption: 'section1.image',
              sourceId: '1tOrZvpIJa9sUpzZujMh8ZUGiFVkGO9rykY_0r3e5a8=',
              width: 0,
              height: 0,
              index: 'a1',
              xywh: '[-449.30232194041315,421.36897768625005,809.3387784090909,788.2159256758866]',
              rotate: 0,
              size: -1,
            },
            children: [],
          },
          {
            type: 'block',
            id: 'ASPLom9c3Y',
            flavour: 'affine:frame',
            version: 1,
            props: {
              title: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'title',
                  },
                ],
              },
              background: '--affine-palette-transparent',
              xywh: '[-608.1241179435484,222.47694052419348,2000,1160]',
              index: 'a0',
            },
            children: [],
          },
        ],
      },
      {
        type: 'block',
        id: 'd18tP0o8zO',
        flavour: 'affine:note',
        version: 1,
        props: {
          xywh: '[461.44820090275005,512.3532626441229,844.5373723274035,666.447458825277]',
          background: '--affine-palette-transparent',
          index: 'a2',
          hidden: false,
          displayMode: 'edgeless',
          edgeless: {
            style: {
              borderRadius: 8,
              borderSize: 4,
              borderStyle: 'none',
              shadowType: '',
            },
            scale: 1.6502952520857732,
            collapse: true,
            collapsedHeight: 403.835288250977,
          },
        },
        children: [
          {
            type: 'block',
            id: 'Lk8MLzilrr',
            flavour: 'affine:paragraph',
            version: 1,
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'section1.content',
                  },
                ],
              },
            },
            children: [],
          },
        ],
      },
    ],
  },
});
