export const TransitionToBEvent = 'TRANSITION_TO_B';
interface TransitionToBEvent {
  type: typeof TransitionToBEvent;
}

export const TransitionToAEvent = 'TRANSITION_TO_A';
interface TransitionToAEvent {
  type: typeof TransitionToAEvent;
}

export type IBinaryEvent = TransitionToBEvent | TransitionToAEvent;
