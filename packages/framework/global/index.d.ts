declare type BlockSuiteFlags = {
  enable_synced_doc_block: boolean;
  enable_pie_menu: boolean;
  enable_database_statistics: boolean;
  enable_block_query: boolean;
  enable_legacy_validation: boolean;
  enable_expand_database_block: boolean;
  enable_lasso_tool: boolean;
  enable_mindmap_entry: boolean;
  readonly: Record<string, boolean>;
};
