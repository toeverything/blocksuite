export type Template = {
  assets?: Record<string, string>;
  content: unknown;
  name?: string;
  preview?: string;
  type: string;
};

export type TemplateCategory = {
  name: string;
  templates: Template[];
};

export interface TemplateManager {
  categories(): Promise<string[]> | string[];

  extend?(manager: TemplateManager): void;

  list(category: string): Promise<Template[]> | Template[];

  search(keyword: string, category?: string): Promise<Template[]> | Template[];
}
