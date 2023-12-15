import type {
  Template,
  TemplateCategory,
  TemplateManager,
} from './template-type.js';
import conceptmap from './templates/concept-map.js';
import flowchart from './templates/flow-chart.js';
import ganttchart from './templates/gantt-chart.js';
import kanban from './templates/kanban.js';
import monthlycalendar from './templates/monthly-calendar.js';
import presentation from './templates/presentation.js';
import projectplanning from './templates/project-planning.js';
import stickers from './templates/stickers.js';
import storyboard from './templates/storyboard.js';

export const templates: TemplateCategory[] = [
  {
    name: 'Marketing',
    templates: [storyboard],
  },
  {
    name: 'Project management',
    templates: [ganttchart, kanban, monthlycalendar, projectplanning],
  },
  {
    name: 'Brainstorming',
    templates: [flowchart, conceptmap],
  },
  {
    name: 'Presentation',
    templates: [presentation],
  },
  {
    name: 'Paws and pals',
    templates: stickers as unknown as Template[],
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
