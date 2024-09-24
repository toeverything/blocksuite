export interface BlockSuiteFlags {
  enable_synced_doc_block: boolean;
  enable_pie_menu: boolean;
  enable_database_number_formatting: boolean;
  enable_database_attachment_note: boolean;
  enable_database_full_width: boolean;
  enable_block_query: boolean;
  enable_legacy_validation: boolean;
  enable_lasso_tool: boolean;
  enable_edgeless_text: boolean;
  enable_ai_onboarding: boolean;
  enable_ai_chat_block: boolean;
  enable_color_picker: boolean;
  enable_mind_map_import: boolean;
  enable_advanced_block_visibility: boolean;
  readonly: Record<string, boolean>;
}
