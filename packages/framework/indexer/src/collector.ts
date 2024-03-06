export type CollectorSchema = {
  TopDocs: {
    params: {
      limit: number;
      skip: number;
    };
    output: string[];
  };
  Count: {
    params: void;
    output: number;
  };
  TermsAggregation: {
    params: {
      field: string;
    };
    output: Record<string, number>;
  };
  Highlight: {
    params: {
      field: string;
      before: string;
      end: string;
      topDocs: {
        limit: number;
        skip: number;
      };
    };
    output: string[];
  };
  DocValue: {
    params: {
      field: string;
      topDocs: {
        limit: number;
        skip: number;
      };
    };
    output: unknown[][];
  };
};

export type Collector = {
  [K in keyof CollectorSchema]: { type: K } & CollectorSchema[K]['params'];
}[keyof CollectorSchema];

export type CollectorOutput<T extends Collector> =
  CollectorSchema[T['type']]['output'];
