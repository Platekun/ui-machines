import { interpret } from 'xstate';

import {
  PhoneNumberPasswordLoginMachine,
  AuthEvents,
  AuthStates,
} from '../src';
import { INVALID_PASSWORD_MESSAGE } from '../src/login/common';
import { INVALID_PHONE_NUMBER_MESSAGE } from '../src/login/phone-number-and-password-login.machine';

const region = 'CO';
/**
 * ? Valid Colombian phone number
 */
const testPhoneNumber = '+573034042344';
const testPassword = 'I Love Cookies';
const invalidPhoneNumberMessage = 'You cannot use that phone number';
const invalidPasswordMessage = 'You cannot use that password';
const loginFailureMessage = 'Woops. Login Failed for some reason';

describe('Phone Number and Password Login Machine', () => {
  it('types phone number, types password and logs in', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest
      .fn()
      .mockImplementation(({ phoneNumber, password }) => {
        expect(phoneNumber).toBe(testPhoneNumber);
        expect(password).toBe(testPassword);

        return Promise.resolve();
      });

    const phoneNumberandPasswordLoginMachine = PhoneNumberPasswordLoginMachine({
      region,
      onLoggedIn,
    });

    const service = interpret(phoneNumberandPasswordLoginMachine)
      .start()
      .onTransition(current => {
        if (current.event.type === AuthEvents.TypePhoneNumber) {
          service.send({ type: AuthEvents.TypePassword, value: testPassword });
        }

        if (current.event.type === AuthEvents.TypePassword) {
          service.send({ type: AuthEvents.Login, loginFn });
        }

        if (current.matches(AuthStates.LoggedIn)) {
          expect(onLoggedIn).toHaveBeenCalledTimes(1);
          expect(loginFn).toHaveBeenCalledTimes(1);
        }
      })
      .onDone(() => {
        done();
      });

    service.send({ type: AuthEvents.TypePhoneNumber, value: testPhoneNumber });
  });

  it('prevents from logging in with invalid parameters', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn();

    const phoneNumberandPasswordLoginMachine = PhoneNumberPasswordLoginMachine({
      region,
      onLoggedIn,
    });

    const service = interpret(phoneNumberandPasswordLoginMachine)
      .start()
      .onTransition(current => {
        if (
          current.matches(AuthStates.Idle) &&
          current.event.type === AuthEvents.Login
        ) {
          expect(onLoggedIn).not.toHaveBeenCalled();
          expect(loginFn).not.toHaveBeenCalled();
          expect(current.context.formErrors).toHaveLength(2);
          expect(
            (current.context.formErrors as Array<Error>)[0].message
          ).toEqual(INVALID_PHONE_NUMBER_MESSAGE);
          expect(
            (current.context.formErrors as Array<Error>)[1].message
          ).toEqual(INVALID_PASSWORD_MESSAGE);
          done();
        }
      });

    service.send({ type: AuthEvents.Login, loginFn });
  });

  it('allows custom error messages for invalid phone number and password', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn();

    const phoneNumberandPasswordLoginMachine = PhoneNumberPasswordLoginMachine({
      region,
      onLoggedIn,
      invalidPhoneNumberMessage,
      invalidPasswordMessage,
    });

    const service = interpret(phoneNumberandPasswordLoginMachine)
      .start()
      .onTransition(current => {
        if (
          current.matches(AuthStates.Idle) &&
          current.event.type === AuthEvents.Login
        ) {
          expect(loginFn).not.toHaveBeenCalled();
          expect(onLoggedIn).not.toHaveBeenCalled();
          expect(current.context.formErrors).toHaveLength(2);
          expect(
            (current.context.formErrors as Array<Error>)[0].message
          ).toEqual(invalidPhoneNumberMessage);
          expect(
            (current.context.formErrors as Array<Error>)[1].message
          ).toEqual(invalidPasswordMessage);
          done();
        }
      });

    service.send({ type: AuthEvents.Login, loginFn });
  });

  it('types phone number, types password, fails to log in', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest
      .fn()
      .mockRejectedValue({ reason: new Error(loginFailureMessage) });

    const phoneNumberandPasswordLoginMachine = PhoneNumberPasswordLoginMachine({
      region,
      onLoggedIn,
    });

    const service = interpret(phoneNumberandPasswordLoginMachine)
      .start()
      .onTransition(current => {
        if (current.event.type === AuthEvents.TypePhoneNumber) {
          service.send({ type: AuthEvents.TypePassword, value: testPassword });
        } else if (current.event.type === AuthEvents.TypePassword) {
          service.send({ type: AuthEvents.Login, loginFn });
        } else if (current.matches(AuthStates.Idle)) {
          expect(loginFn).toHaveBeenCalledTimes(1);
          expect(onLoggedIn).not.toHaveBeenCalled();
          expect((current.context.loginError as Error).message).toBe(
            loginFailureMessage
          );
          done();
        }
      });

    service.send({ type: AuthEvents.TypePhoneNumber, value: testPhoneNumber });
  });
});
