import type { DocMeta, TransformerMiddleware } from '@labre/store';

export const titleMiddleware =
  (metas: DocMeta[]): TransformerMiddleware =>
  ({ slots, adapterConfigs }) => {
    const beforeExportSubscription = slots.beforeExport.subscribe(() => {
      for (const meta of metas) {
        adapterConfigs.set('title:' + meta.id, meta.title);
      }
    });

    return () => {
      beforeExportSubscription.unsubscribe();
    };
  };
