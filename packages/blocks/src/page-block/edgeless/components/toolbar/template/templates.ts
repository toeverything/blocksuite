export type Template = {
  name?: string;
  content: unknown;
  assets?: Record<string, string>;
  preview?: string;
  type: string;
};

export type TemplateCategory = {
  name: string;
  templates: Template[];
};

export interface TemplateManager {
  list(category?: string): Template[];

  categories(): string[];

  search(keyword: string, category?: string): Template[];

  extend(category: string, templates: Template[]): void;
}
