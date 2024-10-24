export type GroupBy = {
  type: 'groupBy';
  columnId: string;
  name: string;
  sort?: {
    desc: boolean;
  };
};
export type GroupProperty = {
  key: string;
  hide?: boolean;
  manuallyCardSort: string[];
};
