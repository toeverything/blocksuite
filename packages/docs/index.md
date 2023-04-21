---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

title: BlockSuite
titleTemplate: The Block-Based Collaborative Framework

hero:
  name: 'BlockSuite'
  text: 'The Block-Based Collaborative Framework'
  tagline: BlockSuite is the open-source collaborative editor project behind AFFiNE.
  actions:
    - theme: brand
      text: Get Started
      link: /introduction
    - theme: alt
      text: Visit Playground
      link: https://blocksuite-toeverything.vercel.app/?init

features:
  - title: 📝 Block-Based Editing
    details: BlockSuite breaks down rich content into discrete <code>contenteditable</code> blocks, avoiding pitfalls using traditional monolith rich text container.
  - title: 🧬 Inherently Collaborative
    details: By harnessing the power of CRDT, any application built with BlockSuite effortlessly supports real-time collaboration right from the start.
  - title: 🧩 Framework Agnostic
    details: With UI components implemented using Web Components, BlockSuite provides editors that can be easily embedded and eliminates the risk of vendor lock-in.
  - title: 🔌 Pluggable Persistence
    details: With its provider-based architecture, BlockSuite facilitates incremental state synchronization without explictly handling asynchronous requests.
  - title: 📏 Compact Rich Text
    details: BlockSuite builds its own rich text component. With minimal responsibilities that benefits from the block-based architecture, this component is light, simple and reliable.
  - title: 🎨 Hybrid Infinite Canvas
    details: A high performance canvas-based renderer is also provided by BlockSuite, fulfilling needs for whiteboard functionalities.
---
