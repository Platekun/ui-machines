import { interpret } from 'xstate';

import { TwoStepsBinaryMachine, BinaryStates, BinaryEvents } from '../src';

const twoStepsBinaryMachine = TwoStepsBinaryMachine(100);

describe('Two Steps Binary Machine', () => {
  it('"A" -> "A -> B" -> "B" -> "A <- B" -> "A"', done => {
    const service = interpret(twoStepsBinaryMachine)
      .start()
      .onTransition(current => {
        if (current.matches(BinaryStates['A -> B'])) {
          expect(current.event.type === BinaryEvents.ToB);
        } else if (current.matches(BinaryStates['A <- B'])) {
          expect(current.event.type === BinaryEvents.ToA);
        } else if (current.matches(BinaryStates.B)) {
          service.send(BinaryEvents.ToA);
        } else if (current.matches(BinaryStates.A)) {
          done();
        }
      });

    service.send(BinaryEvents.ToB);
  });
});
