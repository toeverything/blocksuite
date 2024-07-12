import type { TemplateResult } from 'lit';

export type FilterableListItemKey = string;

export interface FilterableListItem<Props = unknown> {
  aliases?: string[];
  icon?: TemplateResult;
  label?: string;
  name: string;
  props?: Props;
}

export interface FilterableListOptions<Props = unknown> {
  active?: (item: FilterableListItem) => boolean;
  items: FilterableListItem<Props>[];
  onSelect: (item: FilterableListItem) => void;
  placeholder?: string;
}
