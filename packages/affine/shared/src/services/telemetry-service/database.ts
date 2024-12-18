type OrderType = 'desc' | 'asc';
export type WithParams<Map, T> = { [K in keyof Map]: Map[K] & T };
export type SortParams = {
  fieldId: string;
  fieldType: string;
  orderType: OrderType;
  orderIndex: number;
};
export type ViewParams = {
  viewId: string;
  viewType: string;
};
export type DatabaseParams = {
  blockId: string;
};

export type DatabaseViewEvents = {
  DatabaseSortClear: {
    rulesCount: number;
  };
};

export type DatabaseEvents = {
  AddDatabase: {};
};

export interface DatabaseAllSortEvents {
  DatabaseSortAdd: {};
  DatabaseSortRemove: {};
  DatabaseSortModify: {
    oldOrderType: OrderType;
    oldFieldType: string;
    oldFieldId: string;
  };
  DatabaseSortReorder: {
    prevFieldType: string;
    nextFieldType: string;
    newOrderIndex: number;
  };
}

export type DatabaseAllViewEvents = DatabaseViewEvents &
  WithParams<DatabaseAllSortEvents, SortParams>;

export type DatabaseAllEvents = DatabaseEvents &
  WithParams<DatabaseAllViewEvents, ViewParams>;

export type OutDatabaseAllEvents = WithParams<
  DatabaseAllEvents,
  DatabaseParams
>;

export type EventTraceFn<Events> = <K extends keyof Events>(
  key: K,
  params: Events[K]
) => void;
