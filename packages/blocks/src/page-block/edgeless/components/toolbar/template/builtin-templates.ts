import { templates } from './templates.js';

export type Template = {
  name: string;
  content: unknown;
  preview: string;
};

export type TemplateCategory = {
  name: string;
  templates: Template[];
};

interface ITemplateManager {
  list(category?: string): Template[];

  categories(): string[];

  search(keyword: string, category?: string): Template[];

  extends(category: string, templates: Template[]): void;
}

export const builtInTemplates = {
  list: (category?: string) => {
    if (category) {
      return templates.find(cate => cate.name === category)?.templates ?? [];
    }

    return templates.flatMap(cate => cate.templates);
  },

  categories: () => {
    return templates.map(cate => cate.name);
  },

  search: (keyword: string, cateName?: string) => {
    const candidates: Template[] = [];

    templates.forEach(categroy => {
      if (cateName && cateName !== categroy.name) {
        return;
      }

      categroy.templates.forEach(template => {
        template.name.includes(keyword) && candidates.push(template);
      });
    });

    return candidates;
  },

  extends: (cateName: string, templates: Template[]) => {
    const categoryTemplates = builtInTemplates.list(cateName);

    if (categoryTemplates) {
      categoryTemplates.push(...templates);
    }
  },
} satisfies ITemplateManager;
