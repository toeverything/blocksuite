import type { TemplateCategory } from './builtin-templates.js';
import { flowChart } from './json/flow-chart.js';
import { ganttChart } from './json/gantt-chart.js';
import { kanban } from './json/kanban.js';
import { monthlyCalendar } from './json/monthly-calendar.js';
import { storyboard } from './json/storyboard.js';

export const templates: TemplateCategory[] = [
  {
    name: 'Project managerment',
    templates: [kanban, storyboard, monthlyCalendar, ganttChart, flowChart],
  },
];
