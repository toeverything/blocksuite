# 🚧 Framework Integration

::: info
🚧 The implementation of this section is still under development and may be subject to change.
:::

Since the built-in editor in BlockSuite is entirely implemented with web components, it inherently possesses great interoperability with other frameworks. However, due to the large scope of the BlockSuite project, there are in fact many ways to integrate it with other frameworks. Here, we list a few technically feasible approaches:

- **Reusing the AFFiNE editor host**:
  - Wrapping the `EditorContainer` and embedding it as a whole within a third-party framework.
  - Developing widgets within the `EditorContainer` using a third-party framework to create configurable singletons, similar to an editor toolbar.
  - Developing blocks within the `EditorContainer` using a third-party framework.
- **Not reusing the AFFiNE editor host**: This means relying solely on the `@blocksuite/store` to implement a host for mounting a component tree corresponding to the block tree. This type of customization does not require a Lit environment. Take [BlocksVite](https://github.com/zuozijian3720/blocksvite) as an example, where all components are built using Vue by only reusing the BlockSuite store.

Currently, the first-party team is focusing on serving the AFFiNE project and enhancing the fundamental functionality in BlockSuite. Therefore, the priority for support of third-party frameworks is not particularly high. However, if you are interested in integrating BlockSuite with a third-party framework to some extent, or if you encounter any issues along the way, please feel free to contact us for discussion!
