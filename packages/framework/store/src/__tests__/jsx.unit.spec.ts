// checkout https://vitest.dev/guide/debugging.html for debugging tests

import { describe, expect, it } from 'vitest';

import { yDocToJSXNode } from '../utils/jsx.js';

describe('basic', () => {
  it('serialized doc match snapshot', () => {
    expect(
      yDocToJSXNode(
        {
          '0': {
            'sys:children': ['1'],
            'sys:flavour': 'affine:page',
            'sys:id': '0',
          },
          '1': {
            'prop:text': [],
            'prop:type': 'text',
            'sys:children': [],
            'sys:flavour': 'affine:paragraph',
            'sys:id': '1',
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
            'prop:title': 'this is title',
            'sys:children': ['1'],
            'sys:flavour': 'affine:page',
            'sys:id': '0',
          },
          '1': {
            'prop:text': [{ insert: 'just plain text' }],
            'prop:type': 'text',
            'sys:children': [],
            'sys:flavour': 'affine:paragraph',
            'sys:id': '2',
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
            'prop:title': 'this is title',
            'sys:children': ['1'],
            'sys:flavour': 'affine:page',
            'sys:id': '0',
          },
          '1': {
            'prop:text': [
              { insert: 'this is ' },
              {
                attributes: { link: 'http://www.example.com' },
                insert: 'a ',
              },
              {
                attributes: { bold: true, link: 'http://www.example.com' },
                insert: 'link',
              },
              { attributes: { bold: true }, insert: ' with' },
              { insert: ' bold' },
            ],
            'prop:type': 'text',
            'sys:children': [],
            'sys:flavour': 'affine:paragraph',
            'sys:id': '2',
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
