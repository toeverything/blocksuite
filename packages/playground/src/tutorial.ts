// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import 'shepherd.js/dist/css/shepherd.css';

import { assertExists } from '@blocksuite/global/utils';
import Shepherd from 'shepherd.js';

import type { ExampleList } from './components/example-list.js';

export function createExampleListTour(exampleList: ExampleList) {
  assertExists(exampleList.shadowRoot);
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: {
        enabled: true,
      },
      scrollTo: { behavior: 'smooth', block: 'center' },
    },
    modalContainer: exampleList.shadowRoot as unknown as HTMLElement,
  });

  tour.addStep({
    id: 'introduction-step',
    text: 'Select one of example to start',
    attachTo: {
      element: exampleList.shadowRoot.querySelector(
        '.container'
      ) as HTMLElement,
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  });

  tour.addStep({
    id: 'start-step',
    text: 'You can choose BlockSuite starter for the full example',
    attachTo: {
      element: exampleList.shadowRoot.querySelector(
        '.card[data-example-name="BlockSuite Starter"]'
      ) as HTMLElement,
      on: 'bottom',
    },
    buttons: [
      {
        text: 'Next',
        action: tour.complete,
      },
    ],
  });

  return tour;
}
