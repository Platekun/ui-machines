import { Machine } from 'xstate';

import {
  StateA,
  StateB,
  FromStateBToStateA,
  FromStateAToStateB,
} from './common';
import {
  IBinaryEvent,
  TransitionToAEvent,
  TransitionToBEvent,
} from './common/binary.events';

interface IDialogMachineStates {
  states: {
    [StateA]: {};
    [StateB]: {};
    [FromStateBToStateA]: {};
    [FromStateAToStateB]: {};
  };
}

export function TwoStepsBinaryMachine(delayTimeInMs: number) {
  return Machine<{}, IDialogMachineStates, IBinaryEvent>({
    id: 'Two Steps Binary Machine',
    initial: StateB,
    states: {
      [StateA]: {
        on: {
          [TransitionToBEvent]: FromStateAToStateB,
        },
      },
      [StateB]: {
        on: {
          [TransitionToAEvent]: FromStateBToStateA,
        },
      },
      [FromStateBToStateA]: {
        after: {
          [delayTimeInMs]: StateA,
        },
      },
      [FromStateAToStateB]: {
        after: {
          [delayTimeInMs]: StateB,
        },
      },
    },
  });
}
