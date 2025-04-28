import { describe, expect, it } from 'vitest';

import { footnoteUrlPreprocessor } from '../../adapters/markdown/preprocessor';

describe('footnoteUrlPreprocessor', () => {
  it('should encode unencoded URLs in footnote definitions', () => {
    const input =
      '[^ref]: {"type":"url","url":"https://example.com?param=value"}';
    const expected =
      '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com%3Fparam%3Dvalue"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should not encode already encoded URLs', () => {
    const input = '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com"}';
    expect(footnoteUrlPreprocessor(input)).toBe(input);
  });

  it('should handle invalid JSON content', () => {
    const input = '[^ref]: {"invalid json"}';
    expect(footnoteUrlPreprocessor(input)).toBe(input);
  });

  it('should handle non-object footnote data', () => {
    const input = '[^ref]: "not an object"';
    expect(footnoteUrlPreprocessor(input)).toBe(input);
  });

  it('should handle footnote data without url property', () => {
    const input = '[^ref]: {"type":"url"}';
    expect(footnoteUrlPreprocessor(input)).toBe(input);
  });

  it('should handle multiple footnote definitions', () => {
    const input = `
[^ref1]: {"type":"url","url":"https://example1.com"}
[^ref2]: {"type":"url","url":"https://example2.com"}
    `.trim();
    const expected = `
[^ref1]: {"type":"url","url":"https%3A%2F%2Fexample1.com"}
[^ref2]: {"type":"url","url":"https%3A%2F%2Fexample2.com"}
    `.trim();
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should handle special characters in URLs', () => {
    const input =
      '[^ref]: {"type":"url","url":"https://example.com/path with spaces?param=value&another=param"}';
    const expected =
      '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com%2Fpath%20with%20spaces%3Fparam%3Dvalue%26another%3Dparam"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should encode unencoded favicon URLs', () => {
    const input =
      '[^ref]: {"type":"url","url":"https://example.com","favicon":"https://example.com/icon.png"}';
    const expected =
      '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com","favicon":"https%3A%2F%2Fexample.com%2Ficon.png"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should not encode already encoded favicon URLs', () => {
    const input =
      '[^ref]: {"type":"url","url":"https://example.com","favicon":"https%3A%2F%2Fexample.com%2Ficon.png"}';
    const expected =
      '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com","favicon":"https%3A%2F%2Fexample.com%2Ficon.png"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should handle both URL and icon encoding in the same footnote', () => {
    const input =
      '[^ref]: {"type":"url","url":"https://example.com?param=value","favicon":"https://example.com/icon.png?size=large"}';
    const expected =
      '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com%3Fparam%3Dvalue","favicon":"https%3A%2F%2Fexample.com%2Ficon.png%3Fsize%3Dlarge"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should format footnote definition with space', () => {
    const input =
      '[^ref]:{"type":"url","url":"https://example.com?param=value"}';
    const expected =
      '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com%3Fparam%3Dvalue"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should format footnote definition with multiple spaces', () => {
    const input =
      '[^ref]:   {"type":"url","url":"https://example.com?param=value"}';
    const expected =
      '[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com%3Fparam%3Dvalue"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should handle special characters in reference tags', () => {
    const input =
      '[^ref-with-special-chars!@#]: {"type":"url","url":"https://example.com"}';
    const expected =
      '[^ref-with-special-chars!@#]: {"type":"url","url":"https%3A%2F%2Fexample.com"}';
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should handle incomplete footnote definitions', () => {
    const input = '[^ref]:';
    expect(footnoteUrlPreprocessor(input)).toBe(input);
  });

  it('should handle mixed content with non-footnote text', () => {
    const input = `
Some regular text
[^ref]: {"type":"url","url":"https://example.com"}
More regular text
    `.trim();
    const expected = `
Some regular text
[^ref]: {"type":"url","url":"https%3A%2F%2Fexample.com"}
More regular text
    `.trim();
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });

  it('should handle empty input', () => {
    expect(footnoteUrlPreprocessor('')).toBe('');
  });

  it('should handle malformed footnote definitions', () => {
    const input = '[^ref: {"type":"url","url":"https://example.com"}';
    expect(footnoteUrlPreprocessor(input)).toBe(input);
  });

  it('should handle multiple footnotes with mixed content', () => {
    const input = `
[^ref1]: {"type":"url","url":"https://example1.com"}
Some text in between
[^ref2]: {"type":"url","url":"https://example2.com"}
    `.trim();
    const expected = `
[^ref1]: {"type":"url","url":"https%3A%2F%2Fexample1.com"}
Some text in between
[^ref2]: {"type":"url","url":"https%3A%2F%2Fexample2.com"}
    `.trim();
    expect(footnoteUrlPreprocessor(input)).toBe(expected);
  });
});
