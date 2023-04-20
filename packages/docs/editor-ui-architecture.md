# Editor UI Architecture

In the previous sections of the documentation, we primarily introduced the concept of the data layer in BlockSuite. To serve the AFFiNE knowledge base, the BlockSuite project has built the `@blocksuite/editor` package around the data layer. The `EditorContainer` provided by this package can be used as long as it is connected to the `page` instance.

In the following sections, we will explain how the UI layer implemented for the AFFiNE editor is designed. **Note that applications developed based on BlockSuite do not necessarily need to adhere to these conventions**. However, if you wish to reuse, expand, or customize the editing capabilities of AFFiNE, the content presented here should be helpful.
