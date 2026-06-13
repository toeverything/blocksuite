---
'@labre/affine-gfx-template': minor
'@labre/affine-gfx-wardley': minor
'@labre/affine-gfx-edgy': minor
'@labre/affine-gfx-cynefin-estuarine': minor
'@labre/affine-gfx-bpmn': minor
'@labre/affine-widget-edgeless-toolbar': patch
---

Turn the edgeless template panel into a per-framework catalog of worked-example
diagrams and prefab components. Each framework package contributes its own
category (Wardley, EDGY, Cynefin, Estuarine, BPMN) via a new
`extendTemplateCategory` helper, and a generic "Other" category (SWOT, Kanban,
Business Model Canvas, Fishbone, Gantt) ships from the template package. Every
template is composed only from existing shapes — the framework's own prefab
shapes first, general BlockSuite shapes second — so dragging a card inserts real,
editable elements.

The templates senior-toolbar button now renders last (new optional `order` on
`SeniorTool`), and the playground's placeholder cat stickers are removed.
