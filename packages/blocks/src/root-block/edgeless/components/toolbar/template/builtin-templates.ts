import { keys } from '@blocksuite/global/utils';

import type {
  Template,
  TemplateCategory,
  TemplateManager,
} from './template-type.js';

export const templates: TemplateCategory[] = [];

function lcs(text1: string, text2: string) {
  const dp: number[][] = Array.from(
    {
      length: text1.length + 1,
    },
    () => Array.from({ length: text2.length + 1 }, () => 0)
  );

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
const extendTemplate: TemplateManager[] = [];

const flat = <T>(arr: T[][]) =>
  arr.reduce((pre, current) => {
    if (current) {
      return pre.concat(current);
    }

    return pre;
  }, []);

export const builtInTemplates = {
  list: async (category: string) => {
    const extendTemplates = flat(
      await Promise.all(extendTemplate.map(manager => manager.list(category)))
    );

    const cate = templates.find(cate => cate.name === category);
    if (!cate) return extendTemplates;

    const result: Template[] =
      cate.templates instanceof Function
        ? await cate.templates()
        : await Promise.all(
            // @ts-ignore
            keys(cate.templates).map(key => cate.templates[key]())
          );

    return result.concat(extendTemplates);
  },

  categories: async () => {
    const extendCates = flat(
      await Promise.all(extendTemplate.map(manager => manager.categories()))
    );

    return templates.map(cate => cate.name).concat(extendCates);
  },

  search: async (keyword: string, cateName?: string) => {
    const candidates: Template[] = flat(
      await Promise.all(
        extendTemplate.map(manager => manager.search(keyword, cateName))
      )
    );

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
            if (
              lcs(keyword, (name as string).toLocaleLowerCase()) ===
              keyword.length
            ) {
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

  extend(manager: TemplateManager) {
    if (extendTemplate.includes(manager)) return;

    extendTemplate.push(manager);
  },
} satisfies TemplateManager;
