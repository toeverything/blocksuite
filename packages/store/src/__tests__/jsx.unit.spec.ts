// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { describe, expect, it } from 'vitest';

import { yDocToJSXNode } from '../utils/jsx.js';

describe('basic', () => {
  it('serialized doc match snapshot', () => {
    expect(
      yDocToJSXNode(
        {
          '0': {
            'sys:id': '0',
            'sys:children': ['1'],
            'sys:flavour': 'affine:page',
          },
          '1': {
            'sys:id': '1',
            'sys:children': [],
            'sys:flavour': 'affine:paragraph',
            'prop:text': [],
            'prop:type': 'text',
          },
        },
        '0'
      )
    ).toMatchInlineSnapshot(`
      <affine:page>
        <affine:paragraph
          prop:type="text"
        />
      </affine:page>
    `);
  });

  it('block with plain text should match snapshot', () => {
    expect(
      yDocToJSXNode(
        {
          '0': {
            'sys:id': '0',
            'sys:flavour': 'affine:page',
            'sys:children': ['1'],
            'prop:title': 'this is title',
          },
          '1': {
            'sys:id': '2',
            'sys:flavour': 'affine:paragraph',
            'sys:children': [],
            'prop:type': 'text',
            'prop:text': [{ insert: 'just plain text' }],
          },
        },
        '0'
      )
    ).toMatchInlineSnapshot(`
      <affine:page
        prop:title="this is title"
      >
        <affine:paragraph
          prop:text="just plain text"
          prop:type="text"
        />
      </affine:page>
    `);
  });

  it('doc record match snapshot', () => {
    expect(
      yDocToJSXNode(
        {
          '0': {
            'sys:id': '0',
            'sys:flavour': 'affine:page',
            'sys:children': ['1'],
            'prop:title': 'this is title',
          },
          '1': {
            'sys:id': '2',
            'sys:flavour': 'affine:paragraph',
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
      <affine:page
        prop:title="this is title"
      >
        <affine:paragraph
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
      </affine:page>
    `);
  });
});
