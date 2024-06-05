import type { TemplateResult } from 'lit';

export type FilterableListItemKey = string;

export interface FilterableListItem<Props = unknown> {
  name: string;
  label?: string;
  icon?: TemplateResult;
  aliases?: string[];
  props?: Props;
}

export interface FilterableListOptions<Props = unknown> {
  placeholder?: string;
  items: FilterableListItem<Props>[];
  active?: (item: FilterableListItem) => boolean;
  onSelect: (item: FilterableListItem) => void;
}
