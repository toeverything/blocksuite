export type Template = {
  name?: string;
  content: unknown;
  assets?: {
    [index: string]: string;
  };
  preview?: string;
  type: string;
};

export type TemplateCategory = {
  name: string;
  templates: Template[];
};

export interface TemplateManager {
  list(category: string): Promise<Template[]>;

  categories(): Promise<string[]>;

  search(keyword: string, category?: string): Promise<Template[]>;

  extend(manager: TemplateManager): void;
}
