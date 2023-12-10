import type { TemplateCategory } from './builtin-templates.js';
import flowchart from './json/flow-chart.json';
import ganttchart from './json/gantt-chart.json';
import kanban from './json/kanban.json';
import monthlycalendar from './json/monthly-calendar.json';
import storyboard from './json/storyboard.json';

export const templates: TemplateCategory[] = [
  {
    name: 'Project managerment',
    templates: [kanban, storyboard, monthlycalendar, ganttchart, flowchart],
  },
];
