---
'@labre/affine-gfx-bpmn': minor
'@labre/affine-model': minor
'@labre/affine-block-surface': patch
'@labre/affine-shared': patch
---

Add a BPMN process framework (v1, lean) to the edgeless editor. A new
`@labre/affine-gfx-bpmn` package adds a senior-toolbar BPMN button whose menu
drops the core BPMN basics onto the canvas:

- start event (thin green ring), end event (thick red ring), task (rounded
  rectangle with editable label) and exclusive gateway (diamond with an X) -
  all native shapes (editable stroke / fill / text, native resize);
- a sequence-flow item that arms the native connector tool pre-styled solid
  with a filled triangle head;
- a pool background container (rounded-rect frame + editable vertical name
  band), with a resize-lock toggle in its element toolbar.

Visual style is "hybrid": spec-accurate shapes and line weights with accent
colour only on the event rings. Wired behind a `bpmn` block flag (ships dark
until the host enables it). Out of scope for v1: intermediate / parallel /
inclusive gateways, message & association flows, pool lanes, sub-process, data
objects and task-type icons.
