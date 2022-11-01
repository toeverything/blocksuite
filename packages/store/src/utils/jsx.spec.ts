// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { describe, expect, it } from 'vitest';
import { yDocToJSXNode } from './jsx';

describe('basic', () => {
  it('serialized doc match snapshot', () => {
    expect(
      yDocToJSXNode(
        {
          '0': {
            'sys:id': '0',
            'sys:children': ['1'],
            'sys:flavour': 'page',
          },
          '1': {
            'sys:id': '1',
            'sys:children': [],
            'sys:flavour': 'paragraph',
            'prop:text': [],
            'prop:type': 'text',
          },
        },
        '0'
      )
    ).toMatchInlineSnapshot(`
      <page>
        <paragraph
          prop:type="text"
        />
      </page>
    `);
  });

  it('doc record match snapshot', () => {
    expect(
      yDocToJSXNode(
        {
          '0': {
            'sys:id': '0',
            'sys:flavour': 'page',
            'sys:children': ['1'],
            'prop:title': 'this is title',
          },
          '1': {
            'sys:id': '1',
            'sys:flavour': 'group',
            'sys:children': ['2'],
            'prop:xywh': '[0,0,720,32]',
          },
          '2': {
            'sys:id': '2',
            'sys:flavour': 'paragraph',
            'sys:children': [],
            'prop:type': 'text',
            'prop:text': [
              { insert: 'this is ' },
              {
                insert: 'a ',
                attributes: { link: 'http://www.example.com' },
              },
              {
                insert: 'link',
                attributes: { link: 'http://www.example.com', bold: true },
              },
              { insert: ' with', attributes: { bold: true } },
              { insert: ' bold' },
            ],
          },
        },
        '0'
      )
    ).toMatchInlineSnapshot(`
      <page
        prop:title="this is title"
      >
        <group
          prop:xywh="[0,0,720,32]"
        >
          <paragraph
            prop:text={
              <>
                <text
                  insert="this is "
                />
                <text
                  insert="a "
                  link="http://www.example.com"
                />
                <text
                  bold={true}
                  insert="link"
                  link="http://www.example.com"
                />
                <text
                  bold={true}
                  insert=" with"
                />
                <text
                  insert=" bold"
                />
              </>
            }
            prop:type="text"
          />
        </group>
      </page>
    `);
  });
});
