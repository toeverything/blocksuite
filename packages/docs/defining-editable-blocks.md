# 🚧 Defining Editable Blocks

::: info
🚧 The implementation of this section is still under development and may be subject to change.
:::

Blocks are scalable in BlockSuite. When defining a block with UI, there are several important aspects to consider:

- `BlockSchema`: This is used to determine the data structure of the block model.
- `BlockComponent`: This is used to define the UI components of the block.
- `BlockService`: This is used to provide callback functions for events such as clipboard interactions.

Currently, further standardization of the block UI layer is still in progress. In the future, we will provide a standardized API for defining editable blocks. If you're interested in this, you can directly refer to the implementation in [`@blocksuite/blocks`](https://github.com/toeverything/blocksuite/tree/master/packages/blocks/src) as a reference.
