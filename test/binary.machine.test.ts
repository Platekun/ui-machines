import { interpret } from 'xstate';

import { binaryMachine, BinaryStates, BinaryEvents } from '../src';

describe('Binary Machine', () => {
  it('"A" -> "B" -> "A"', done => {
    const service = interpret(binaryMachine)
      .start()
      .onTransition(current => {
        if (current.matches(BinaryStates.B)) {
          service.send(BinaryEvents.ToA);
        }

        if (
          current.matches(BinaryStates.A) &&
          current.event.type === BinaryEvents.ToA
        ) {
          done();
        }
      });

    service.send(BinaryEvents.ToB);
  });
});
