import type {
  Template,
  TemplateCategory,
  TemplateManager,
} from './template-type.js';
import fourpmarketingmatrix from './templates/4p-marketing-matrix.js';
import businessproposal from './templates/business-proposal.js';
import conceptmap from './templates/concept-map.js';
import dataanalysis from './templates/data-analysis.js';
import flowchart from './templates/flow-chart.js';
import ganttchart from './templates/gantt-chart.js';
import kanban from './templates/kanban.js';
import monthlycalendar from './templates/monthly-calendar.js';
import projectplanning from './templates/project-planning.js';
import simplepresentation from './templates/simple-presentation.js';
import smartprinciples from './templates/smart-principles.js';
import stickers from './templates/stickers.js';
import storyboard from './templates/storyboard.js';
import swot from './templates/swot.js';

export const templates: TemplateCategory[] = [
  {
    name: 'Marketing',
    templates: [storyboard, fourpmarketingmatrix],
  },
  {
    name: 'Project management',
    templates: [ganttchart, kanban, monthlycalendar, projectplanning],
  },
  {
    name: 'Brainstorming',
    templates: [swot, flowchart, conceptmap, smartprinciples],
  },
  {
    name: 'Presentation',
    templates: [dataanalysis, simplepresentation, businessproposal],
  },
  {
    name: 'Paws and pals',
    templates: stickers as unknown as Template[],
  },
];

function lcs(text1: string, text2: string) {
  const dp: number[][] = new Array(text1.length + 1)
    .fill(null)
    .map(() => new Array(text2.length + 1).fill(0));

  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= text2.length; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[text1.length][text2.length];
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

    keyword = keyword.trim().toLocaleLowerCase();

    templates.forEach(categroy => {
      if (cateName && cateName !== categroy.name) {
        return;
      }

      categroy.templates.forEach(template => {
        template.name &&
          lcs(keyword, template.name.toLocaleLowerCase()) === keyword.length &&
          candidates.push(template);
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
