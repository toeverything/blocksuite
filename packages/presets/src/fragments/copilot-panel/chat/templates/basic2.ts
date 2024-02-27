export const basic2 = () => ({
  type: 'page',
  meta: {
    id: 'doc:home',
    title: '2 section page',
    createDate: 1706096829983,
    tags: [],
  },
  blocks: {
    type: 'block',
    id: '4k9gyowERO',
    flavour: 'affine:page',
    version: 2,
    props: {
      title: {
        '$blocksuite:internal:text$': true,
        delta: [
          {
            insert: '2 section page',
          },
        ],
      },
    },
    children: [
      {
        type: 'block',
        id: 'vkhJd4BCsm',
        flavour: 'affine:surface',
        version: 5,
        props: {
          elements: {
            shBRVXVIvt: {
              index: 'a2',
              seed: 180753848,
              xywh: '[1813.1550011986524,1315.1160275661014,396.75577755004065,51]',
              rotate: 0,
              text: {
                'affine:surface:text': true,
                delta: [
                  {
                    insert: 'section1.title',
                  },
                ],
              },
              color: '--affine-palette-line-white',
              fontSize: 36,
              fontFamily: 'blocksuite:surface:Poppins',
              fontWeight: '400',
              fontStyle: 'normal',
              textAlign: 'left',
              type: 'text',
              id: 'shBRVXVIvt',
              hasMaxWidth: true,
            },
            Xruur2sxsF: {
              index: 'a3',
              seed: 180753848,
              xywh: '[1813.1550011986524,1771.1970691195438,397,51]',
              rotate: 0,
              text: {
                'affine:surface:text': true,
                delta: [
                  {
                    insert: 'section2.title',
                  },
                ],
              },
              color: '--affine-palette-line-white',
              fontSize: 36,
              fontFamily: 'blocksuite:surface:Poppins',
              fontWeight: '400',
              fontStyle: 'normal',
              textAlign: 'left',
              type: 'text',
              id: 'Xruur2sxsF',
              hasMaxWidth: true,
            },
          },
        },
        children: [
          {
            type: 'block',
            id: 'aHW8B76Jhq',
            flavour: 'affine:image',
            version: 1,
            props: {
              caption: 'background',
              sourceId: 'c5WqorczdXNRTDylYFYRXCbjVaKI52WCjB6n2KkWz0o=',
              width: 1920,
              height: 1080,
              index: 'a0',
              xywh: '[1666.7359173724976,976.4135765594543,1920,1080]',
              rotate: 0,
              size: 46176,
            },
            children: [],
          },
          {
            type: 'block',
            id: 'Ub84fA6I-q',
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
              xywh: '[1626.7359173724976,936.4135765594543,2000,1160.5237653297754]',
              index: 'a0',
            },
            children: [],
          },
          {
            type: 'block',
            id: 'p1dGwdyVW3',
            flavour: 'affine:image',
            version: 1,
            props: {
              caption: 'section1.image',
              sourceId: 'SCDlMb31Ccd5SE8R5bhR5XRz87bgUYiymhy_aUlkrDI=',
              width: 0,
              height: 0,
              index: 'a1x',
              xywh: '[3034.852702954911,966.0920621363774,559.4585336538462,1063.8639669215424]',
              rotate: 0,
              size: -1,
            },
            children: [],
          },
        ],
      },
      {
        type: 'block',
        id: '9SqUOExlw_',
        flavour: 'affine:note',
        version: 1,
        props: {
          xywh: '[2277.2085777051534,1199.8785904668794,699.6216856060605,288.23011363636374]',
          background: '--affine-palette-transparent',
          index: 'a1V',
          hidden: false,
          displayMode: 'edgeless',
          edgeless: {
            style: {
              borderRadius: 8,
              borderSize: 4,
              borderStyle: 'solid',
              shadowType: '',
            },
            scale: 1,
            collapse: true,
            collapsedHeight: 288.23011363636374,
          },
        },
        children: [
          {
            type: 'block',
            id: 'kI0YsJu7Az',
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
      {
        type: 'block',
        id: '_6XpvGFFIh',
        flavour: 'affine:note',
        version: 1,
        props: {
          xywh: '[2277.2085777051534,1595.7711094062734,699.6216856060605,288.23011363636374]',
          background: '--affine-palette-transparent',
          index: 'a1l',
          hidden: false,
          displayMode: 'edgeless',
          edgeless: {
            style: {
              borderRadius: 8,
              borderSize: 4,
              borderStyle: 'solid',
              shadowType: '',
            },
            scale: 1,
            collapse: true,
            collapsedHeight: 288.23011363636374,
          },
        },
        children: [
          {
            type: 'block',
            id: 'zv2OsTo7BB',
            flavour: 'affine:paragraph',
            version: 1,
            props: {
              type: 'text',
              text: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'section2.content',
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
