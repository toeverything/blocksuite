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
  - title: 🔌 Pluggable Persistence
    details: With its provider-based architecture, BlockSuite facilitates incremental state synchronization without explictly handling asynchronous requests.
---
