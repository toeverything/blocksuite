declare type BlockSuiteFlags = {
  enable_ai_onboarding: boolean;
  enable_block_query: boolean;
  enable_database_attachment_note: boolean;
  enable_database_statistics: boolean;
  enable_edgeless_text: boolean;
  enable_expand_database_block: boolean;
  enable_lasso_tool: boolean;
  enable_legacy_validation: boolean;
  enable_pie_menu: boolean;
  enable_synced_doc_block: boolean;
  readonly: Record<string, boolean>;
};
