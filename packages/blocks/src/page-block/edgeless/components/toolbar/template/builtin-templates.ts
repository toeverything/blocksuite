import { keys } from '../../../../../_common/utils/iterable.js';
import type { Template, TemplateManager } from './template-type.js';

export const templates = [
  {
    name: 'Marketing',
    templates: {
      Storyboard: () =>
        import('./templates/storyboard.js').then(val => val.default),
      '4P Marketing Matrix': () =>
        import('./templates/4p-marketing-matrix.js').then(val => val.default),
      'User Journey Map': () =>
        import('./templates/user-journey.js').then(val => val.default),
    },
  },
  {
    name: 'Project management',
    templates: {
      Gantt: () =>
        import('./templates/gantt-chart.js').then(val => val.default),
      Kanban: () => import('./templates/kanban.js').then(val => val.default),
      'Montly Calendar': () =>
        import('./templates/monthly-calendar.js').then(val => val.default),
      Fishbone: () =>
        import('./templates/fishbone.js').then(val => val.default),
      'Project Planning': () =>
        import('./templates/project-planning.js').then(val => val.default),
    },
  },
  {
    name: 'Brainstorming',
    templates: {
      SWOT: () => import('./templates/swot.js').then(val => val.default),
      '5W2H': () => import('./templates/2h5w.js').then(val => val.default),
      'Flow Chart': () =>
        import('./templates/flow-chart.js').then(val => val.default),
      'Concept Map': () =>
        import('./templates/concept-map.js').then(val => val.default),
      'SMART Principles': () =>
        import('./templates/smart-principles.js').then(val => val.default),
    },
  },
  {
    name: 'Presentation',
    templates: {
      'Data Analysis': () =>
        import('./templates/data-analysis.js').then(val => val.default),
      'Simple Presentation': () =>
        import('./templates/simple-presentation.js').then(val => val.default),
      'Business Proposal': () =>
        import('./templates/business-proposal.js').then(val => val.default),
    },
  },
  {
    name: 'Paws and pals',
    templates: () => import('./templates/stickers.js').then(val => val.default),
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
  list: async (category: string) => {
    const cate = templates.find(cate => cate.name === category);
    if (!cate) return [];

    return cate.templates instanceof Function
      ? await cate.templates()
      : // @ts-ignore
        Promise.all(keys(cate.templates).map(key => cate.templates[key]()));
  },

  categories: async () => {
    return templates.map(cate => cate.name);
  },

  search: async (keyword: string, cateName?: string) => {
    const candidates: Template[] = [];

    keyword = keyword.trim().toLocaleLowerCase();

    await Promise.all(
      templates.map(async categroy => {
        if (cateName && cateName !== categroy.name) {
          return;
        }

        if (categroy.templates instanceof Function) {
          return;
        }

        return Promise.all(
          keys(categroy.templates).map(async name => {
            if (lcs(keyword, name.toLocaleLowerCase()) === keyword.length) {
              // @ts-ignore
              const template = await categroy.templates[name]();

              candidates.push(template);
            }
          })
        );
      })
    );

    return candidates;
  },
} satisfies TemplateManager;
