import { EdgelessTemplatePanel } from './toolbar/template-panel.js';
import type {
  Template,
  TemplateCategory,
  TemplateManager,
} from './toolbar/template-type.js';

function loadCategory(category: TemplateCategory): Promise<Template[]> {
  return Array.isArray(category.templates)
    ? Promise.resolve(category.templates)
    : category.templates();
}

/** Wrap a single {@link TemplateCategory} as a {@link TemplateManager}. */
function categoryManager(category: TemplateCategory): TemplateManager {
  return {
    categories: () => [category.name],
    list: async cate =>
      cate === category.name ? await loadCategory(category) : [],
    search: async keyword => {
      const all = await loadCategory(category);
      const k = keyword.trim().toLocaleLowerCase();
      return all.filter(t => t.name?.toLocaleLowerCase().includes(k));
    },
  };
}

const registered = new Set<string>();

/**
 * Contribute a template category to the edgeless template panel. Idempotent per
 * category name (a framework's ViewExtension `effect()` may run more than once).
 * Lets each framework package own its template definitions while the panel
 * aggregates every contributed category. The future favorites feature reads the
 * same registry to decide which framework toolbars to show.
 */
export function extendTemplateCategory(category: TemplateCategory) {
  if (registered.has(category.name)) return;
  registered.add(category.name);
  EdgelessTemplatePanel.templates.extend(categoryManager(category));
}
