import type { BlockSnapshot } from '@blocksuite/store';

import { MemoryBlobCRUD } from '@blocksuite/store';
import { AssetsManager } from '@blocksuite/store';
import { describe, expect, test } from 'vitest';

import { HtmlAdapter } from '../../_common/adapters/html.js';
import { nanoidReplacement } from '../../_common/test-utils/test-utils.js';
import { NoteDisplayMode } from '../../_common/types.js';
import { createJob } from '../utils/create-job.js';

const template = (html: string) =>
  `
<!doctype html>
<html>
<head>
  <style>
    input[type='checkbox'] {
      display: none;
    }
    label:before {
      background: rgb(30, 150, 235);
      border-radius: 3px;
      height: 16px;
      width: 16px;
      display: inline-block;
      cursor: pointer;
    }
    input[type='checkbox'] + label:before {
      content: '';
      background: rgb(30, 150, 235);
      color: #fff;
      font-size: 16px;
      line-height: 16px;
      text-align: center;
    }
    input[type='checkbox']:checked + label:before {
      content: '✓';
    }
  </style>
</head>
<body>
<div style="width: 70vw; margin: 60px auto;"><!--BlockSuiteDocTitlePlaceholder-->
<!--HtmlTemplate-->
</div>
</body>
</html>
`
    .replace(/\s\s+|\n/g, '')
    .replace('<!--HtmlTemplate-->', html);

describe('snapshot to html', () => {
  test('code', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:code',
              id: 'block:8hOLxad5Fv',
              props: {
                language: 'python',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'import this',
                    },
                  ],
                },
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const html = template(
      `<pre><code class="code-python"><span style="word-wrap: break-word; color: #AF00DB;">import</span><span style="word-wrap: break-word; color: #000000;"> this</span></code></pre>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('code upper case', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:code',
              id: 'block:8hOLxad5Fv',
              props: {
                language: 'PYTHON',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'import this',
                    },
                  ],
                },
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const html = template(
      `<pre><code class="code-python"><span style="word-wrap: break-word; color: #AF00DB;">import</span><span style="word-wrap: break-word; color: #000000;"> this</span></code></pre>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('code unknown', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:code',
              id: 'block:8hOLxad5Fv',
              props: {
                language: 'unknown',
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'import this',
                    },
                  ],
                },
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const html = template(
      `<pre><code class="code-unknown">import this</code></pre>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('paragraph', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'block:72SMa5mdLy',
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'bbb',
                        },
                      ],
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
                {
                  children: [
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:sP3bU52el7',
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: [
                            {
                              insert: 'ddd',
                            },
                          ],
                        },
                        type: 'text',
                      },
                      type: 'block',
                    },
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:X_HMxP4wxC',
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: [
                            {
                              insert: 'eee',
                            },
                          ],
                        },
                        type: 'text',
                      },
                      type: 'block',
                    },
                    {
                      children: [],
                      flavour: 'affine:paragraph',
                      id: 'block:iA34Rb-RvV',
                      props: {
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: [
                            {
                              insert: 'fff',
                            },
                          ],
                        },
                        type: 'text',
                      },
                      type: 'block',
                    },
                  ],
                  flavour: 'affine:paragraph',
                  id: 'block:f-Z6nRrGK_',
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ccc',
                        },
                      ],
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
                {
                  children: [],
                  flavour: 'affine:paragraph',
                  id: 'block:I0Fmz5Nv02',
                  props: {
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ggg',
                        },
                      ],
                    },
                    type: 'text',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:paragraph',
              id: 'block:Bdn8Yvqcny',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:12lDwMD7ec',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'hhh',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const html = template(
      `<div class="affine-paragraph-block-container"><p>aaa</p><div class="affine-block-children-container" style="padding-left: 26px;"><div class="affine-paragraph-block-container"><p>bbb</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div><div class="affine-paragraph-block-container"><p>ccc</p><div class="affine-block-children-container" style="padding-left: 26px;"><div class="affine-paragraph-block-container"><p>ddd</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div><div class="affine-paragraph-block-container"><p>eee</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div><div class="affine-paragraph-block-container"><p>fff</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div></div></div><div class="affine-paragraph-block-container"><p>ggg</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div></div></div><div class="affine-paragraph-block-container"><p>hhh</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('bulleted list', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      children: [],
                      flavour: 'affine:list',
                      id: 'block:UyvxA_gqCJ',
                      props: {
                        checked: false,
                        collapsed: false,
                        text: {
                          '$blocksuite:internal:text$': true,
                          delta: [
                            {
                              insert: 'ccc',
                            },
                          ],
                        },
                        type: 'bulleted',
                      },
                      type: 'block',
                    },
                  ],
                  flavour: 'affine:list',
                  id: 'block:kYliRIovvL',
                  props: {
                    checked: false,
                    collapsed: false,
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'bbb',
                        },
                      ],
                    },
                    type: 'bulleted',
                  },
                  type: 'block',
                },
                {
                  children: [],
                  flavour: 'affine:list',
                  id: 'block:-guNZRm5u1',
                  props: {
                    checked: false,
                    collapsed: false,
                    text: {
                      '$blocksuite:internal:text$': true,
                      delta: [
                        {
                          insert: 'ddd',
                        },
                      ],
                    },
                    type: 'bulleted',
                  },
                  type: 'block',
                },
              ],
              flavour: 'affine:list',
              id: 'block:imiLDMKSkx',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                  ],
                },
                type: 'bulleted',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:list',
              id: 'block:B9CaZzQ2CO',
              props: {
                checked: false,
                collapsed: false,
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'eee',
                    },
                  ],
                },
                type: 'bulleted',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const html = template(
      `<div class="affine-list-block-container"><ul style=""><li>aaa</li></ul><div class="affine-block-children-container" style="padding-left: 26px;"><div class="affine-list-block-container"><ul style=""><li>bbb</li></ul><div class="affine-block-children-container" style="padding-left: 26px;"><div class="affine-list-block-container"><ul style=""><li>ccc</li></ul><div class="affine-block-children-container" style="padding-left: 26px;"></div></div></div></div><div class="affine-list-block-container"><ul style=""><li>ddd</li></ul><div class="affine-block-children-container" style="padding-left: 26px;"></div></div></div></div><div class="affine-list-block-container"><ul style=""><li>eee</li></ul><div class="affine-block-children-container" style="padding-left: 26px;"></div></div>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('code inline', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:qhpbuss-KN',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      attributes: {
                        code: true,
                      },
                      insert: 'bbb',
                    },
                    {
                      insert: ' ccc',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const html = template(
      `<div class="affine-paragraph-block-container"><p>aaa <code>bbb</code> ccc</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('link', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:Bdn8Yvqcny',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa ',
                    },
                    {
                      attributes: {
                        link: 'https://affine.pro/',
                      },
                      insert: 'bbb',
                    },
                    {
                      insert: ' ccc',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };
    const html = template(
      `<div class="affine-paragraph-block-container"><p>aaa <a href="https://affine.pro/">bbb</a> ccc</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('bold', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:zxDyvrg1Mh',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                    {
                      attributes: {
                        bold: true,
                      },
                      insert: 'bbb',
                    },
                    {
                      insert: 'ccc',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const html = template(
      `<div class="affine-paragraph-block-container"><p>aaa<strong>bbb</strong>ccc</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('italic', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:Tk4gSPocAt',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:zxDyvrg1Mh',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [
                    {
                      insert: 'aaa',
                    },
                    {
                      attributes: {
                        italic: true,
                      },
                      insert: 'bbb',
                    },
                    {
                      insert: 'ccc',
                    },
                  ],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:WfnS5ZDCJT',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:vu6SK6WJpW',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const html = template(
      `<div class="affine-paragraph-block-container"><p>aaa<em>bbb</em>ccc</p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const target = await htmlAdapter.fromBlockSnapshot({
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });

  test('image', async () => {
    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:surface',
          id: 'block:zqtuv999Ww',
          props: {
            elements: {},
          },
          type: 'block',
        },
        {
          children: [
            {
              children: [],
              flavour: 'affine:image',
              id: 'block:Gan31s-dYK',
              props: {
                caption: 'aaa',
                height: 0,
                index: 'a0',
                rotate: 0,
                sourceId: 'YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=',
                width: 0,
                xywh: '[0,0,0,0]',
              },
              type: 'block',
            },
            {
              children: [],
              flavour: 'affine:paragraph',
              id: 'block:If92CIQiOl',
              props: {
                text: {
                  '$blocksuite:internal:text$': true,
                  delta: [],
                },
                type: 'text',
              },
              type: 'block',
            },
          ],
          flavour: 'affine:note',
          id: 'block:UTUZojv22c',
          props: {
            background: '--affine-background-secondary-color',
            displayMode: NoteDisplayMode.DocAndEdgeless,
            hidden: false,
            index: 'a0',
            xywh: '[0,0,800,95]',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:page',
      id: 'block:WcYcyv-oZY',
      props: {
        title: {
          '$blocksuite:internal:text$': true,
          delta: [],
        },
      },
      type: 'block',
    };

    const html = template(
      `<figure class="affine-image-block-container"><img src="assets/YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=.blob" alt="YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=.blob" title="aaa"></figure><div class="affine-paragraph-block-container"><p></p><div class="affine-block-children-container" style="padding-left: 26px;"></div></div>`
    );

    const htmlAdapter = new HtmlAdapter(createJob());
    const blobManager = new MemoryBlobCRUD();
    await blobManager.set(
      'YXXTjRmLlNyiOUnHb8nAIvUP6V7PAXhwW9F5_tc2LGs=',
      new Blob()
    );
    const assets = new AssetsManager({ blob: blobManager });

    const target = await htmlAdapter.fromBlockSnapshot({
      assets,
      snapshot: blockSnapshot,
    });
    expect(target.file).toBe(html);
  });
});

describe('html to snapshot', () => {
  test('code', async () => {
    const html = template(
      `<pre><code class="code-python"><span style="word-wrap: break-word; color: #81A1C1;">import</span><span style="word-wrap: break-word; color: #D8DEE9FF;"> this</span></code></pre>`
    );

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:code',
          id: 'matchesReplaceMap[1]',
          props: {
            language: 'python',
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'import this',
                },
              ],
            },
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const htmlAdapter = new HtmlAdapter(createJob());
    const rawBlockSnapshot = await htmlAdapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('paragraph', async () => {
    const html = template(`<p>aaa</p><p>bbb</p><p>ccc</p><p>ddd</p><p>eee</p>`);

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[1]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'aaa',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[2]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'bbb',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[3]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'ccc',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[4]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'ddd',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
        {
          children: [],
          flavour: 'affine:paragraph',
          id: 'matchesReplaceMap[5]',
          props: {
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'eee',
                },
              ],
            },
            type: 'text',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const htmlAdapter = new HtmlAdapter(createJob());
    const rawBlockSnapshot = await htmlAdapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('p in list', async () => {
    const html = template(`<ol><li><p>p in list</p></li></ol>`);

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:list',
          id: 'matchesReplaceMap[1]',
          props: {
            checked: false,
            collapsed: false,
            text: {
              '$blocksuite:internal:text$': true,
              delta: [
                {
                  insert: 'p in list',
                },
              ],
            },
            type: 'numbered',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const htmlAdapter = new HtmlAdapter(createJob());
    const rawBlockSnapshot = await htmlAdapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });

  test('iframe', async () => {
    const html = template(
      `<iframe width="560" height="315" src="https://www.youtube.com/embed/QDsd0nyzwz0?start=&amp;end=" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
    );

    const blockSnapshot: BlockSnapshot = {
      children: [
        {
          children: [],
          flavour: 'affine:embed-youtube',
          id: 'matchesReplaceMap[1]',
          props: {
            url: 'https://www.youtube.com/watch?v=QDsd0nyzwz0',
          },
          type: 'block',
        },
      ],
      flavour: 'affine:note',
      id: 'matchesReplaceMap[0]',
      props: {
        background: '--affine-background-secondary-color',
        displayMode: NoteDisplayMode.DocAndEdgeless,
        hidden: false,
        index: 'a0',
        xywh: '[0,0,800,95]',
      },
      type: 'block',
    };

    const htmlAdapter = new HtmlAdapter(createJob());
    const rawBlockSnapshot = await htmlAdapter.toBlockSnapshot({
      file: html,
    });
    expect(nanoidReplacement(rawBlockSnapshot)).toEqual(blockSnapshot);
  });
});
