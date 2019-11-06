import { Machine } from 'xstate';
import {
  StateA,
  StateB,
  TransitionToAEvent,
  TransitionToBEvent,
  IBinaryEvent,
} from './common';

interface IBinaryMachineStates {
  states: {
    [StateA]: {};
    [StateB]: {};
  };
}

export const binaryMachine = Machine<{}, IBinaryMachineStates, IBinaryEvent>({
  id: 'Binary Machine',
  initial: StateA,
  states: {
    [StateA]: {
      on: {
        [TransitionToBEvent]: StateB,
      },
    },
    [StateB]: {
      on: {
        [TransitionToAEvent]: StateA,
      },
    },
  },
});
