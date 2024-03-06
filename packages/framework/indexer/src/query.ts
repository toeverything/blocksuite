export type MatchQuery = {
  type: 'match';
  field: string;
  match: string;
};

export type BooleanQuery = {
  type: 'boolean';
  occur: 'should' | 'must' | 'must_not';
  queries: Query[];
};

export type AllQuery = {
  type: 'all';
};

export type Query = BooleanQuery | MatchQuery | AllQuery;
