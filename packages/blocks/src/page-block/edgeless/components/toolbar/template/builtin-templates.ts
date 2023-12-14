import flowchart from './json/flow-chart.json';
import ganttchart from './json/gantt-chart.json';
import kanban from './json/kanban.json';
import monthlycalendar from './json/monthly-calendar.json';
import stickers from './json/stickers.json';
import storyboard from './json/storyboard.json';
import type {
  Template,
  TemplateCategory,
  TemplateManager,
} from './templates.js';

export const templates: TemplateCategory[] = [
  {
    name: 'Project managerment',
    templates: [kanban, storyboard, monthlycalendar, ganttchart, flowchart],
  },
  {
    name: 'Stickers',
    templates: stickers,
  },
];

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
        template.name?.includes(keyword) && candidates.push(template);
      });
    });

    return candidates;
  },

  extend: (cateName: string, templates: Template[]) => {
    const categoryTemplates = builtInTemplates.list(cateName);

    if (categoryTemplates) {
      categoryTemplates.push(...templates);
    }
  },
} satisfies TemplateManager;
