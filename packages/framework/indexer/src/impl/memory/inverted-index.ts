import Fuse, { type FuseResultMatch } from 'fuse.js';

import { Weight } from './weight.js';

export interface InvertedIndex<T> {
  match(term: string): Weight;

  insert(id: number, term: T): void;

  highlight(id: number, before: string, after: string): string;
}

export class StringInvertedIndex implements InvertedIndex<string> {
  index: Map<string, number[]> = new Map();

  match(term: string): Weight {
    const weight = new Weight();

    for (const id of this.index.get(term) ?? []) {
      weight.addScore(id, 1);
    }

    return weight;
  }

  insert(id: number, term: string): void {
    const ids = this.index.get(term) ?? [];
    ids.push(id);
    this.index.set(term, ids);
  }

  highlight(): string {
    return '';
  }
}

export class IntegerInvertedIndex implements InvertedIndex<number> {
  index: Map<number, number[]> = new Map();

  match(term: string): Weight {
    const weight = new Weight();

    for (const id of this.index.get(parseInt(term)) ?? []) {
      weight.addScore(id, 1);
    }

    return weight;
  }

  insert(id: number, term: number): void {
    const ids = this.index.get(term) ?? [];
    ids.push(id);
    this.index.set(term, ids);
  }

  highlight(): string {
    return '';
  }
}

export class DateInvertedIndex implements InvertedIndex<number> {
  index: Map<number, number[]> = new Map();

  match(term: string): Weight {
    const weight = new Weight();

    for (const id of this.index.get(parseInt(term)) ?? []) {
      weight.addScore(id, 1);
    }

    return weight;
  }

  insert(id: number, term: number): void {
    const ids = this.index.get(term) ?? [];
    ids.push(id);
    this.index.set(term, ids);
  }

  highlight(): string {
    return '';
  }
}

export class FullTextInvertedIndex implements InvertedIndex<string> {
  records = [] as { id: number; v: string }[];
  index = Fuse.createIndex(['v'], [] as { id: number; v: string }[]);

  lastMatches = new Map<number, readonly FuseResultMatch[]>();

  match(term: string): Weight {
    const searcher = new Fuse(
      this.records,
      {
        includeScore: true,
        includeMatches: true,
        shouldSort: true,
        keys: ['v'],
      },
      this.index
    );
    const result = searcher.search(term);

    const weight = new Weight();
    this.lastMatches = new Map();

    for (const value of result) {
      weight.addScore(value.item.id, 1 - (value.score ?? 1));

      this.lastMatches.set(value.item.id, value.matches!);
    }

    return weight;
  }

  insert(id: number, term: string): void {
    this.index.add({ id, v: term });
    this.records.push({ id, v: term });
  }

  highlight(id: number, before: string, after: string): string {
    const matches = this.lastMatches.get(id);
    if (!matches || matches.length === 0) {
      return '';
    }

    const firstMatch = matches[0];

    const text = firstMatch.value;
    if (!text) {
      return '';
    }

    let result = '';
    let pointer = 0;
    for (const match of matches) {
      for (const [start, end] of match.indices) {
        result += text.substring(pointer, start);
        result += `${before}${text.substring(start, end + 1)}${after}`;
        pointer = end + 1;
      }
    }
    result += text.substring(pointer);

    return result;
  }
}
