type WithKanbanViewType<T> = T extends unknown
  ? {
      type: 'kanban';
      viewId: string;
    } & T
  : never;

export type KanbanCellSelection = {
  cardId: string;
  columnId: string;
  groupKey: string;
  isEditing: boolean;
  selectionType: 'cell';
};
export type KanbanCardSelectionCard = {
  cardId: string;
  groupKey: string;
};
export type KanbanCardSelection = {
  cards: [KanbanCardSelectionCard, ...KanbanCardSelectionCard[]];
  selectionType: 'card';
};
export type KanbanGroupSelection = {
  groupKeys: [string, ...string[]];
  selectionType: 'group';
};
export type KanbanViewSelection =
  | KanbanCardSelection
  | KanbanCellSelection
  | KanbanGroupSelection;
export type KanbanViewSelectionWithType =
  WithKanbanViewType<KanbanViewSelection>;
