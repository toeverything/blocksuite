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
  - title: 🧬 CRDT-Driven State Management
    details: By leveraging CRDT technology, BlockSuite supports zero-cost time travel, real-time collaboration, and pluggable persistence backends right out of the box.
  - title: 🎨 Framework Agnostic Rendering
    details: BlockSuite offers Web Components and hybrid canvas-based renderers, facilitating the creation of diverse collaborative applications.
---
