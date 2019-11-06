import {
  StateA,
  StateB,
  FromStateAToStateB,
  FromStateBToStateA,
} from './common/binary.states';
import { TransitionToAEvent, TransitionToBEvent } from './common/binary.events';

export const BinaryStates: {
  A: typeof StateA;
  B: typeof StateB;
  'A -> B': typeof FromStateAToStateB;
  'A <- B': typeof FromStateBToStateA;
} = {
  A: StateA,
  B: StateB,
  'A -> B': FromStateAToStateB,
  'A <- B': FromStateBToStateA,
};

export const BinaryEvents: {
  ToA: typeof TransitionToAEvent;
  ToB: typeof TransitionToBEvent;
} = {
  ToA: TransitionToAEvent,
  ToB: TransitionToBEvent,
};

export * from './binary.machine';
export * from './two-steps-binary.machine';
