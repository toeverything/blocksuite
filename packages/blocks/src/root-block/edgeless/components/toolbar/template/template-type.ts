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
  list(category: string): Promise<Template[]> | Template[];

  categories(): Promise<string[]> | string[];

  search(keyword: string, category?: string): Promise<Template[]> | Template[];

  extend?(manager: TemplateManager): void;
}
