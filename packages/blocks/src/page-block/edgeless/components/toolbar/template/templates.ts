import type { TemplateCategory } from './builtin-templates.js';

export const templates: TemplateCategory[] = [
  {
    name: 'Project managerment',
    templates: [
      {
        name: 'example1',
        preview:
          '<svg width="85" height="50" viewBox="0 0 85 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="85" height="50" fill="white"/><line x1="16" y1="31.8907" x2="22" y2="31.8907" stroke="#6B6B6B" stroke-width="0.218649"/><line x1="16" y1="31.8907" x2="22" y2="31.8907" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M33 31H36.1325V22.8918V19.0001L40 19" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M52 19H64.1883V13V10L68 10.0001" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M29 31H35.8083L35.8089 36.8873V39.9999L40 40" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M62 19H64.685V24.9999V27.9999L68 28" stroke="#6B6B6B" stroke-width="0.218649"/><rect x="40" y="36" width="12" height="7" rx="0.728829" fill="#9DD194"/><rect x="40.0364" y="36.0364" width="11.9271" height="6.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="3" y="28" width="13" height="6" rx="0.728829" fill="#FFDE6B"/><rect x="3.03644" y="28.0364" width="12.9271" height="5.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="54.7686" y="19.1265" width="6.22715" height="6.22715" transform="rotate(-45 54.7686 19.1265)" fill="#937EE7"/><rect x="54.8201" y="19.1265" width="6.15427" height="6.15427" transform="rotate(-45 54.8201 19.1265)" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="21.4038" y="30.8835" width="6.22715" height="6.22715" transform="rotate(-45 21.4038 30.8835)" fill="#937EE7"/><rect x="21.4553" y="30.8835" width="6.15427" height="6.15427" transform="rotate(-45 21.4553 30.8835)" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="40" y="16" width="12" height="7" rx="0.728829" fill="#FFDE6B"/><rect x="40.0364" y="16.0364" width="11.9271" height="6.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="68" y="8" width="13" height="6" rx="0.728829" fill="#937EE7"/><rect x="68.0364" y="8.03644" width="12.9271" height="5.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="68" y="24" width="13" height="7" rx="0.728829" fill="#937EE7"/><rect x="68.0364" y="24.0364" width="12.9271" height="6.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/></svg>',
        content: {
          type: 'page',
          meta: {
            id: 'page:home',
            title: 'BlockSuite Playground',
            createDate: 1701765881935,
            tags: [],
          },
          blocks: {
            type: 'block',
            id: 'block:1VxnfD_8xb',
            flavour: 'affine:page',
            props: {
              title: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'BlockSuite Playground',
                  },
                ],
              },
            },
            children: [
              {
                type: 'block',
                id: 'block:pcmYJQ63hX',
                flavour: 'affine:surface',
                props: {
                  elements: {
                    '6Q-N18m1h7': {
                      type: 'text',
                      xywh: '[1003.312197418738,-2610.2482247992803,895.1110308192447,108]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              'This column represents tasks that are scheduled but not yet started.',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 36,
                      fontFamily: 'blocksuite:surface:Poppins',
                      fontWeight: '600',
                      fontStyle: 'italic',
                      textAlign: 'left',
                      id: '6Q-N18m1h7',
                      index: 'aD',
                      seed: 818008543,
                      hasMaxWidth: true,
                    },
                    edyYUt_oJL: {
                      type: 'text',
                      xywh: '[2438.152409845841,-2611.6320997176986,1015.487548828125,54]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              'This column shows tasks that are currently in progress.',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 36,
                      fontFamily: 'blocksuite:surface:Poppins',
                      fontWeight: '600',
                      fontStyle: 'italic',
                      textAlign: 'left',
                      id: 'edyYUt_oJL',
                      index: 'aE',
                      seed: 1621352812,
                    },
                    '6Qh8zbMziO': {
                      type: 'text',
                      xywh: '[4242.464346633909,-2612.6320997176986,1005.5516357421875,54]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              'This column includes tasks that have been completed.',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 36,
                      fontFamily: 'blocksuite:surface:Poppins',
                      fontWeight: '600',
                      fontStyle: 'italic',
                      textAlign: 'left',
                      id: '6Qh8zbMziO',
                      index: 'aF',
                      seed: 507015729,
                    },
                    BmOmdekpay: {
                      type: 'text',
                      xywh: '[181.50669753721104,-2571.5509442882258,462.51983642578125,54]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: 'Project tracking Kanban',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 40,
                      fontFamily: 'blocksuite:surface:Satoshi',
                      fontWeight: '600',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'BmOmdekpay',
                      index: 'aG',
                      seed: 748310487,
                    },
                    JI8htWNAxX: {
                      type: 'text',
                      xywh: '[181.50669753721104,-2460.1670693698075,543,130]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              'A Kanban template for project tracking typically includes a visual board divided into columns representing different stages of a project, such as "planned," "ongoing," and "Complete."',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 24,
                      fontFamily: 'blocksuite:surface:Satoshi',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'JI8htWNAxX',
                      index: 'aH',
                      seed: 810997411,
                      hasMaxWidth: true,
                    },
                    '-K-H02zO-R': {
                      type: 'text',
                      xywh: '[181.506697537211,-2296.6176968560217,543,130]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              "This template allows tasks to be added as cards under these columns. As work progresses, cards are moved along the columns, offering a clear, real-time view of the project's progress.",
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 24,
                      fontFamily: 'blocksuite:surface:Satoshi',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: '-K-H02zO-R',
                      index: 'aI',
                      seed: 1630326155,
                      hasMaxWidth: true,
                    },
                    '-vvVHIw4aX': {
                      type: 'text',
                      xywh: '[181.50669753721104,-2127.40067068264,543,97.5]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              'This template is useful for managing workflow, prioritizing tasks, and ensuring efficient project execution.',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 24,
                      fontFamily: 'blocksuite:surface:Satoshi',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: '-vvVHIw4aX',
                      index: 'aJ',
                      seed: 1907471211,
                      hasMaxWidth: true,
                    },
                    J_7Uy0M1s3: {
                      type: 'group',
                      children: {
                        'affine:surface:ymap': true,
                        json: {
                          BmOmdekpay: true,
                          JI8htWNAxX: true,
                          '-K-H02zO-R': true,
                          '-vvVHIw4aX': true,
                          'block:nc1pGg4Gsh': true,
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
                      id: 'J_7Uy0M1s3',
                      index: 'aK',
                      seed: 482315495,
                    },
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:0TfuSHlg-r',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Planned',
                          },
                        ],
                      },
                      background: '--affine-tag-purple',
                      xywh: '[903.6314320451293,-2646.170782828957,1392.4777890462692,2009.7726069909259]',
                      index: 'a0',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:ud0l5lpJ4M',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Ongoing',
                          },
                        ],
                      },
                      background: '--affine-tag-yellow',
                      xywh: '[2408.687017161555,-2646.170782828957,1663.3762265462692,1987.9080784643184]',
                      index: 'a1',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:13f5S1cQAf',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Complete',
                          },
                        ],
                      },
                      background: '--affine-tag-gray',
                      xywh: '[4200.563769981869,-2646.170782828957,1620.2902890462692,1987.9080784643184]',
                      index: 'a2',
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:nc1pGg4Gsh',
                flavour: 'affine:note',
                props: {
                  xywh: '[138.15040568039362,-2623.7164418835932,643.6167403419201,760.6976526754111]',
                  background: '--affine-background-secondary-color',
                  index: 'a0',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 8,
                      borderSize: 4,
                      borderStyle: 'solid',
                      shadowType: '--affine-note-shadow-film',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:Gf__igY0HL',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:pzEpwxhPSW',
                flavour: 'affine:note',
                props: {
                  xywh: '[1025.8905595508895,-2367.9643675746183,364,360.7657696824615]',
                  background: '--affine-tag-orange',
                  index: 'a1',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 362.53729127607653,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:8BDU90iR2j',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:dsUdpkG1uN',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:JrxG4A4-bl',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:Uo8YsWZDdn',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:_9TBhYB2z6',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:B_Mw4hOTa9',
                flavour: 'affine:note',
                props: {
                  xywh: '[1455.9038157514049,-2367.9643675746183,364,345.6208786944021]',
                  background: '--affine-tag-orange',
                  index: 'a2',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 342.4265140043026,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:Ea6Y3x2abb',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:bn_mCM4lQY',
                flavour: 'affine:note',
                props: {
                  xywh: '[2531.5121606788566,-2362.172146460574,364,360.690320348461]',
                  background: '--affine-tag-red',
                  index: 'a3',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 362.53729127607653,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:FI8iP8THFj',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:fFBqn5mixY',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:VgRB3pm31s',
                flavour: 'affine:note',
                props: {
                  xywh: '[3025.821367582859,-2376.4225738654554,364,362.53729127607653]',
                  background: '--affine-tag-red',
                  index: 'a4',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:HNYhsiS5CY',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:1y7yxc_hnc',
                flavour: 'affine:note',
                props: {
                  xywh: '[2555.197481910908,-1886.0200352647353,364,362.53729127607653]',
                  background: '--affine-tag-red',
                  index: 'a5',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:2bef40UnVW',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h3',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:Ykf1Rx3kie',
                flavour: 'affine:note',
                props: {
                  xywh: '[4318.089419077733,-2362.172146460574,364,360.690320348461]',
                  background: '--affine-tag-blue',
                  index: 'a6',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 362.53729127607653,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:Ecdib6wqhO',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:Rzm3SAcKwH',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:Vq7mkZYRdb',
                flavour: 'affine:note',
                props: {
                  xywh: '[1025.8905595508895,-2367.9643675746183,364,360.7657696824615]',
                  background: '--affine-tag-orange',
                  index: 'a7',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 362.53729127607653,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:0J5krbr4VR',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:7NzKliNr5z',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:z6ssTxchJP',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:AT20JufICI',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:8vpXc-Bjig',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:J714CSXe6U',
                flavour: 'affine:note',
                props: {
                  xywh: '[1455.9038157514049,-2367.9643675746183,364,345.6208786944021]',
                  background: '--affine-tag-orange',
                  index: 'a8',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 342.4265140043026,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:z61oo3iBr_',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:F-TNp7zwe4',
                flavour: 'affine:note',
                props: {
                  xywh: '[2531.5121606788566,-2362.172146460574,364,360.690320348461]',
                  background: '--affine-tag-red',
                  index: 'a9',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 362.53729127607653,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:lvduEYLjUU',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:MM27Z-LS1p',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:eMA160AKGf',
                flavour: 'affine:note',
                props: {
                  xywh: '[3025.821367582859,-2376.4225738654554,364,362.53729127607653]',
                  background: '--affine-tag-red',
                  index: 'aA',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:DJnew1ZOyX',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:RF0q5wPdA4',
                flavour: 'affine:note',
                props: {
                  xywh: '[2555.197481910908,-1886.0200352647353,364,362.53729127607653]',
                  background: '--affine-tag-red',
                  index: 'aB',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:suo3BHqc9o',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h3',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:KmvUmTxuKl',
                flavour: 'affine:note',
                props: {
                  xywh: '[4318.089419077733,-2362.172146460574,364,360.690320348461]',
                  background: '--affine-tag-blue',
                  index: 'aC',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                    collapsedHeight: 362.53729127607653,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:8epKIrafPT',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h1',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:-D3q4nMZ6s',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        name: 'storyboard',
        preview:
          '<svg width="85" height="50" viewBox="0 0 85 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="85" height="50" fill="white"/><line x1="16" y1="31.8907" x2="22" y2="31.8907" stroke="#6B6B6B" stroke-width="0.218649"/><line x1="16" y1="31.8907" x2="22" y2="31.8907" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M33 31H36.1325V22.8918V19.0001L40 19" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M52 19H64.1883V13V10L68 10.0001" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M29 31H35.8083L35.8089 36.8873V39.9999L40 40" stroke="#6B6B6B" stroke-width="0.218649"/><path d="M62 19H64.685V24.9999V27.9999L68 28" stroke="#6B6B6B" stroke-width="0.218649"/><rect x="40" y="36" width="12" height="7" rx="0.728829" fill="#9DD194"/><rect x="40.0364" y="36.0364" width="11.9271" height="6.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="3" y="28" width="13" height="6" rx="0.728829" fill="#FFDE6B"/><rect x="3.03644" y="28.0364" width="12.9271" height="5.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="54.7686" y="19.1265" width="6.22715" height="6.22715" transform="rotate(-45 54.7686 19.1265)" fill="#937EE7"/><rect x="54.8201" y="19.1265" width="6.15427" height="6.15427" transform="rotate(-45 54.8201 19.1265)" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="21.4038" y="30.8835" width="6.22715" height="6.22715" transform="rotate(-45 21.4038 30.8835)" fill="#937EE7"/><rect x="21.4553" y="30.8835" width="6.15427" height="6.15427" transform="rotate(-45 21.4553 30.8835)" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="40" y="16" width="12" height="7" rx="0.728829" fill="#FFDE6B"/><rect x="40.0364" y="16.0364" width="11.9271" height="6.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="68" y="8" width="13" height="6" rx="0.728829" fill="#937EE7"/><rect x="68.0364" y="8.03644" width="12.9271" height="5.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/><rect x="68" y="24" width="13" height="7" rx="0.728829" fill="#937EE7"/><rect x="68.0364" y="24.0364" width="12.9271" height="6.92712" rx="0.692388" stroke="black" stroke-opacity="0.1" stroke-width="0.0728829"/></svg>',
        asserts: {
          'pQzvckPjmd0QPBOYJj0lRAezTAl43BtaWqVFZkydgzQ=':
            'https://imagedelivery.net/S2JgHUJzW7ZzW77qOAfRfA/a5aa36ec-a2e1-4d7f-dd00-ee621f34f500/public',
          '4rOMygicmDxT3mgVjW1-PtavNtg1TGpkNReRIwRy0fQ=':
            'https://imagedelivery.net/S2JgHUJzW7ZzW77qOAfRfA/8b7b54ae-b5ae-442f-5733-6fa35d935e00/public',
        },
        content: {
          type: 'page',
          meta: {
            id: 'page:Tk8yvi7TtE',
            title: 'Storyboard',
            createDate: 1701855520579,
            tags: [],
          },
          blocks: {
            type: 'block',
            id: 'block:_sq72SgftX',
            flavour: 'affine:page',
            props: {
              title: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'Storyboard',
                  },
                ],
              },
            },
            children: [
              {
                type: 'block',
                id: 'block:Vslciq5Tsw',
                flavour: 'affine:surface',
                props: {
                  elements: {
                    '5bPSTkBelz': {
                      type: 'text',
                      xywh: '[-623.312317566272,-20.125818767528926,102.39999389648438,153.5]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '01',
                          },
                        ],
                      },
                      color: '--affine-palette-line-grey',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: '5bPSTkBelz',
                      index: 'a0',
                      seed: 888423873,
                    },
                    'Cv-Kkmz9aC': {
                      type: 'shape',
                      xywh: '[-623.312317566272,-510.4671790604059,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: 'Cv-Kkmz9aC',
                      index: 'a1',
                      seed: 1877921497,
                      color: '--affine-palette-line-black',
                    },
                    y5ZK_Hlq2D: {
                      type: 'text',
                      xywh: '[333.41774645201497,-20.125818767528898,103,154]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '02',
                          },
                        ],
                      },
                      color: '--affine-palette-line-blue',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'y5ZK_Hlq2D',
                      index: 'a5',
                      seed: 39875881,
                    },
                    qpnYJBKHGg: {
                      type: 'shape',
                      xywh: '[333.41774645201497,-510.4671790604059,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: 'qpnYJBKHGg',
                      index: 'a6',
                      seed: 1076908986,
                      color: '--affine-palette-line-black',
                    },
                    '671DNrP_sE': {
                      type: 'text',
                      xywh: '[1290.1478104703021,-20.12581876752894,103,154]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '03',
                          },
                        ],
                      },
                      color: '--affine-palette-line-purple',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: '671DNrP_sE',
                      index: 'a9',
                      seed: 963046928,
                    },
                    UqX1bKv8di: {
                      type: 'shape',
                      xywh: '[1290.1478104703021,-510.46717906040595,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: 'UqX1bKv8di',
                      index: 'aA',
                      seed: 1813280158,
                      color: '--affine-palette-line-black',
                    },
                    ZBfrEL1PyL: {
                      type: 'text',
                      xywh: '[2216.773020328646,-20.12581876752892,103,154]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '04',
                          },
                        ],
                      },
                      color: '--affine-palette-line-green',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'ZBfrEL1PyL',
                      index: 'aC',
                      seed: 1654062447,
                    },
                    '7_3H8gs_M0': {
                      type: 'shape',
                      xywh: '[2216.773020328646,-510.46717906040595,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: '7_3H8gs_M0',
                      index: 'aD',
                      seed: 1632921055,
                      color: '--affine-palette-line-black',
                    },
                    He2q2iLluI: {
                      type: 'text',
                      xywh: '[-623.3123175662716,905.8585775910734,103,154]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '05',
                          },
                        ],
                      },
                      color: '--affine-palette-line-orange',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'He2q2iLluI',
                      index: 'aF',
                      seed: 1329611161,
                    },
                    eRjgoJ_PO0: {
                      type: 'shape',
                      xywh: '[-623.3123175662716,415.5172172981964,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: 'eRjgoJ_PO0',
                      index: 'aG',
                      seed: 663330323,
                      color: '--affine-palette-line-black',
                    },
                    'V-FK3ebnt1': {
                      type: 'text',
                      xywh: '[356.09442107741177,905.8585775910734,103,154]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '06',
                          },
                        ],
                      },
                      color: '--affine-palette-line-magenta',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'V-FK3ebnt1',
                      index: 'aI',
                      seed: 1364259955,
                    },
                    '9o9_urPWat': {
                      type: 'shape',
                      xywh: '[356.09442107741177,415.5172172981964,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: '9o9_urPWat',
                      index: 'aJ',
                      seed: 1326119795,
                      color: '--affine-palette-line-black',
                    },
                    AxmmlFfmZy: {
                      type: 'text',
                      xywh: '[1303.8521073764198,905.8585775910734,103,154]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '07',
                          },
                        ],
                      },
                      color: '--affine-palette-line-blue',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'AxmmlFfmZy',
                      index: 'aL',
                      seed: 51782970,
                    },
                    aDz5kGBwSw: {
                      type: 'shape',
                      xywh: '[1303.8521073764198,415.5172172981964,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: 'aDz5kGBwSw',
                      index: 'aM',
                      seed: 2070815342,
                      color: '--affine-palette-line-black',
                    },
                    XUoXvxaQ6o: {
                      type: 'text',
                      xywh: '[2229.2037444382922,905.8585775910734,103,154]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '08',
                          },
                        ],
                      },
                      color: '--affine-palette-line-tangerine',
                      fontSize: 128,
                      fontFamily: 'blocksuite:surface:BebasNeue',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: 'XUoXvxaQ6o',
                      index: 'aO',
                      seed: 610565560,
                    },
                    '4HpcXHHyCG': {
                      type: 'shape',
                      xywh: '[2229.2037444382922,415.51721729819644,749.0048669510401,465.24173261151157]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-transparent',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: '4HpcXHHyCG',
                      index: 'aP',
                      seed: 92714421,
                      color: '--affine-palette-line-black',
                    },
                    '9D9dgqb3_T': {
                      type: 'text',
                      xywh: '[-1991.971780114972,-403.81244318618457,371,194]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              "A storyboard template is a tool for visualizing a story's narrative with illustrations. \n\nIt's widely used in animation, film, and video game design, and has become essential for businesses in mapping customer experiences.\n\nThis tool is key for team alignment, idea pitching, and understanding customer journeys.",
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 16,
                      fontFamily: 'blocksuite:surface:Satoshi',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: '9D9dgqb3_T',
                      index: 'aT',
                      seed: 172461233,
                      hasMaxWidth: true,
                    },
                    '9kTksrdooV': {
                      type: 'text',
                      xywh: '[-1993.1100096192029,-455.71746314435444,141.86395263671875,32.5]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: 'Stoardboard',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 24,
                      fontFamily: 'blocksuite:surface:Satoshi',
                      fontWeight: '600',
                      fontStyle: 'normal',
                      textAlign: 'left',
                      id: '9kTksrdooV',
                      index: 'aU',
                      seed: 1798838512,
                    },
                    '-HQm5uRmiD': {
                      type: 'shape',
                      xywh: '[-1993.1100096192029,-155.30093141487959,372.1382295042306,121]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0.1,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-line-black',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: '-HQm5uRmiD',
                      index: 'af',
                      seed: 1243500994,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              'Use the pen tool\nto sketch out the scenes\nof the storyboard',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontFamily: 'blocksuite:surface:Satoshi',
                      textAlign: 'left',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      fontSize: 16,
                    },
                    eDwrSwLvT1: {
                      type: 'shape',
                      xywh: '[-1993.1100096192029,13.541009953474223,372.1382295042306,126]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0.1,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-line-black',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: 'eDwrSwLvT1',
                      index: 'aY',
                      seed: 740967169,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert:
                              'Double click notes to \ndescribe whats happening \nin each scene',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontFamily: 'blocksuite:surface:Satoshi',
                      textAlign: 'left',
                      fontWeight: '400',
                      fontStyle: 'normal',
                      fontSize: 16,
                    },
                    NqZ_5sIXDi: {
                      type: 'text',
                      xywh: '[-1648.5387887440108,-155.30093141487959,11.583999633789062,47.5]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '1',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 32,
                      fontFamily: 'blocksuite:surface:Poppins',
                      fontWeight: '600',
                      fontStyle: 'italic',
                      textAlign: 'left',
                      id: 'NqZ_5sIXDi',
                      index: 'ag',
                      seed: 1741938248,
                    },
                    CkRZQnBdPT: {
                      type: 'text',
                      xywh: '[-1652.0912282617626,13.398605829259246,18.367996215820312,47.5]',
                      rotate: 0,
                      text: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '2',
                          },
                        ],
                      },
                      color: '--affine-palette-line-black',
                      fontSize: 32,
                      fontFamily: 'blocksuite:surface:Poppins',
                      fontWeight: '600',
                      fontStyle: 'italic',
                      textAlign: 'left',
                      id: 'CkRZQnBdPT',
                      index: 'ac',
                      seed: 794575694,
                    },
                    JuHYf15fsy: {
                      type: 'group',
                      children: {
                        'affine:surface:ymap': true,
                        json: {
                          eDwrSwLvT1: true,
                          CkRZQnBdPT: true,
                          'block:1N0UWZkK_8': true,
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
                      id: 'JuHYf15fsy',
                      index: 'ad',
                      seed: 1573998966,
                      xywh: '[-2072.0422562424897,-60.25228947394268,372.1382295042306,126.14240412421498]',
                    },
                    'puvDjor9-d': {
                      type: 'group',
                      children: {
                        'affine:surface:ymap': true,
                        json: {
                          '-HQm5uRmiD': true,
                          NqZ_5sIXDi: true,
                          'block:rjD1NH1bz1': true,
                        },
                      },
                      title: {
                        'affine:surface:text': true,
                        delta: [
                          {
                            insert: '324234',
                          },
                        ],
                      },
                      id: 'puvDjor9-d',
                      index: 'af',
                      seed: 47439129,
                      xywh: '[-1967.659085824912,-191.76177163350204,372.1382295042306,121]',
                    },
                    '9pzQ4PtJqc': {
                      type: 'shape',
                      xywh: '[-2066.2474634433406,-547.4694048830397,1110.2447838460484,789.3937055152682]',
                      rotate: 0,
                      shapeType: 'rect',
                      shapeStyle: 'General',
                      radius: 0,
                      filled: true,
                      fillColor: '--affine-palette-shape-white',
                      strokeWidth: 4,
                      strokeColor: '--affine-palette-line-black',
                      strokeStyle: 'solid',
                      roughness: 1.4,
                      id: '9pzQ4PtJqc',
                      index: 'Zz',
                      seed: 441326486,
                      color: '--affine-palette-line-black',
                    },
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:fkXg4KufTv',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-gray',
                      xywh: '[-663.1275820232445,-547.4694048830397,828.6353958649848,711.2490457412829]',
                      index: 'a0',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:tPPJWh8fBf',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-blue',
                      xywh: '[293.60248199504247,-547.4694048830397,828.6353958649848,711.2490457412829]',
                      index: 'a1',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:IrLiYhlb_T',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-purple',
                      xywh: '[1250.3325460133296,-547.4694048830397,828.6353958649848,711.2490457412829]',
                      index: 'a2',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:LUJuvPKPdR',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-green',
                      xywh: '[2176.9577558716733,-547.4694048830397,828.6353958649848,711.2490457412829]',
                      index: 'a3',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:-y4TFKXJaP',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-yellow',
                      xywh: '[-663.1275820232444,378.5149914755626,828.6353958649848,711.2490457412829]',
                      index: 'a4',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:aOTmVs-FuZ',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-red',
                      xywh: '[316.27915662043904,378.5149914755626,828.6353958649848,711.2490457412829]',
                      index: 'a5',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:NNBwJnSOBh',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-teal',
                      xywh: '[1264.036842919447,378.5149914755626,828.6353958649848,711.2490457412829]',
                      index: 'a6',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:rMJjJ7V6xb',
                    flavour: 'affine:frame',
                    props: {
                      title: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Board title',
                          },
                        ],
                      },
                      background: '--affine-tag-orange',
                      xywh: '[2189.3884799813195,378.5149914755627,828.6353958649848,711.2490457412829]',
                      index: 'a7',
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:rjD1NH1bz1',
                    flavour: 'affine:image',
                    props: {
                      caption: '',
                      sourceId: 'pQzvckPjmd0QPBOYJj0lRAezTAl43BtaWqVFZkydgzQ=',
                      width: 0,
                      height: 0,
                      index: 'ah',
                      xywh: '[-1795.5188339520957,-137.42603506396046,157.61387206265383,98.99257227794752]',
                      rotate: 0,
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:1N0UWZkK_8',
                    flavour: 'affine:image',
                    props: {
                      caption: '',
                      sourceId: '4rOMygicmDxT3mgVjW1-PtavNtg1TGpkNReRIwRy0fQ=',
                      width: 0,
                      height: 0,
                      index: 'aal',
                      xywh: '[-1779.307672616336,51.18653958469409,127.21644435457343,81.65683618351409]',
                      rotate: 0,
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:Jrhw1YLWKV',
                flavour: 'affine:note',
                props: {
                  xywh: '[-230.1873471257049,-79.13555810124546,372.68990428151096,212.50973933371654]',
                  background: '--affine-background-secondary-color',
                  index: 'a2',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:8VZyVPAO_I',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
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
                id: 'block:GFpdoPhgc2',
                flavour: 'affine:note',
                props: {
                  xywh: '[730.5968545529315,-85.50413258738763,372.83083297527776,218.87831381985876]',
                  background: '--affine-tag-teal',
                  index: 'a7',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'solid',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:fUXH2joezs',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
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
                id: 'block:Fb5AygNUnr',
                flavour: 'affine:note',
                props: {
                  xywh: '[1678.3545408519394,-77.3784889090899,371.9321020416821,217.1878667538341]',
                  background: '--affine-tag-pink',
                  index: 'aB',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'solid',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:BmuUA6tq3T',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
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
                id: 'block:fYGdA3MvTu',
                flavour: 'affine:note',
                props: {
                  xywh: '[2603.706177913812,-77.37848890908987,373.20567483815285,216.99615367852667]',
                  background: '--affine-tag-yellow',
                  index: 'aE',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'solid',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:Zmykj3phX3',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
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
                id: 'block:pxhK-W1vEZ',
                flavour: 'affine:note',
                props: {
                  xywh: '[-236.37915998110554,848.6059074495124,373.20567483815285,207.95975843368183]',
                  background: '--affine-tag-orange',
                  index: 'aH',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'solid',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:zIPWPdYTQU',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
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
                id: 'block:gB_LQwY9cK',
                flavour: 'affine:note',
                props: {
                  xywh: '[743.027578662578,848.6059074495124,373.20567483815296,206.363094177334]',
                  background: '--affine-tag-purple',
                  index: 'aK',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:0NjuAbiCKz',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
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
                id: 'block:ow9HsFYnuJ',
                flavour: 'affine:note',
                props: {
                  xywh: '[1690.785264961586,848.6059074495124,373.2056748381531,210.93935583599136]',
                  background: '--affine-tag-gray',
                  index: 'aN',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:QzGVkmTwxV',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
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
                id: 'block:Fonoa8wxUT',
                flavour: 'affine:note',
                props: {
                  xywh: '[2616.136902023459,848.6059074495124,373.20567483815285,210.8557329187879]',
                  background: '--affine-tag-blue',
                  index: 'aQ',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 2,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-sticker',
                    },
                    collapse: true,
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:HjrnOLxGkv',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Describe whats happening in the scene',
                          },
                        ],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:W050lCccMc',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:LTdGuueeCp',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [],
                      },
                    },
                    children: [],
                  },
                ],
              },
              {
                type: 'block',
                id: 'block:kF8KTh-WvC',
                flavour: 'affine:note',
                props: {
                  xywh: '[-1487.0582041163204,-467.4589900465258,448,618]',
                  background: '--affine-palette-transparent',
                  index: 'aR',
                  hidden: false,
                  edgeless: {
                    style: {
                      borderRadius: 0,
                      borderSize: 4,
                      borderStyle: 'none',
                      shadowType: '--affine-note-shadow-film',
                    },
                  },
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:48VdaTzf8L',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h3',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Storyboard brief',
                          },
                        ],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:V9VYl5WXhx',
                    flavour: 'affine:divider',
                    props: {},
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:7cNtrQ0W6g',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Story summary',
                          },
                        ],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:LJzurmfoOl',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'text',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert:
                              'Describe the purpose and outcome of the storyboards in paragraph form. Outline any main points.',
                            attributes: {
                              color:
                                'var(--affine-text-highlight-foreground-grey)',
                            },
                          },
                        ],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:lbS_RuR-vF',
                    flavour: 'affine:divider',
                    props: {},
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:g9MuIZIzLx',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Key goals and needs',
                          },
                        ],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:CWIonXIklJ',
                    flavour: 'affine:list',
                    props: {
                      type: 'numbered',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'This is item 1',
                          },
                        ],
                      },
                      checked: false,
                      collapsed: false,
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:PhYhzCaieP',
                    flavour: 'affine:list',
                    props: {
                      type: 'numbered',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'This is item 2',
                          },
                        ],
                      },
                      checked: false,
                      collapsed: false,
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:PLkpsctwaY',
                    flavour: 'affine:list',
                    props: {
                      type: 'numbered',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'This is item 3',
                          },
                        ],
                      },
                      checked: false,
                      collapsed: false,
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:MxqJnBLuJe',
                    flavour: 'affine:divider',
                    props: {},
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:GNPBYTu7Fc',
                    flavour: 'affine:paragraph',
                    props: {
                      type: 'h6',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'Key pains and constraints',
                          },
                        ],
                      },
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:tq_8TfOK6n',
                    flavour: 'affine:list',
                    props: {
                      type: 'bulleted',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'This is item 1',
                          },
                        ],
                      },
                      checked: false,
                      collapsed: false,
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:GAEEyaqD4x',
                    flavour: 'affine:list',
                    props: {
                      type: 'bulleted',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'This is item 2',
                          },
                        ],
                      },
                      checked: false,
                      collapsed: false,
                    },
                    children: [],
                  },
                  {
                    type: 'block',
                    id: 'block:Tm7U_L0sbq',
                    flavour: 'affine:list',
                    props: {
                      type: 'bulleted',
                      text: {
                        '$blocksuite:internal:text$': true,
                        delta: [
                          {
                            insert: 'This is item 3',
                          },
                        ],
                      },
                      checked: false,
                      collapsed: false,
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  },
];
