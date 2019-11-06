import { interpret } from 'xstate';

import { EmailAndPasswordLoginMachine, AuthEvents, AuthStates } from '../src';
import { INVALID_PASSWORD_MESSAGE } from '../src/login/common';
import { INVALID_EMAIL_MESSAGE } from '../src/login/email-and-password-login.machine';

const testEmail = 'johndoe@test.com';
const testPassword = 'I Love Cookies';
const invalidEmailMessage = 'You cannot use that email name';
const invalidPasswordMessage = 'You cannot use that password';
const loginFailureMessage = 'Woops. Login Failed for some reason';

describe('Email and Password Login Machine', () => {
  it('types email, types password and logs in', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn().mockImplementation(({ email, password }) => {
      expect(email).toBe(testEmail);
      expect(password).toBe(testPassword);

      return Promise.resolve();
    });

    const emailAndPasswordMachine = EmailAndPasswordLoginMachine({
      onLoggedIn,
    });

    const service = interpret(emailAndPasswordMachine)
      .start()
      .onTransition(current => {
        if (current.event.type === AuthEvents.TypeEmail) {
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

    service.send({ type: AuthEvents.TypeEmail, value: testEmail });
  });

  it('prevents from logging in with invalid parameters', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn();

    const emailAndPasswordMachine = EmailAndPasswordLoginMachine({
      onLoggedIn,
    });

    const service = interpret(emailAndPasswordMachine)
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
          ).toEqual(INVALID_EMAIL_MESSAGE);
          expect(
            (current.context.formErrors as Array<Error>)[1].message
          ).toEqual(INVALID_PASSWORD_MESSAGE);
          done();
        }
      });

    service.send({ type: AuthEvents.Login, loginFn });
  });

  it('allows custom error messages for invalid email and password', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn();

    const emailAndPasswordMachine = EmailAndPasswordLoginMachine({
      onLoggedIn,
      invalidEmailMessage,
      invalidPasswordMessage,
    });

    const service = interpret(emailAndPasswordMachine)
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
          ).toEqual(invalidEmailMessage);
          expect(
            (current.context.formErrors as Array<Error>)[1].message
          ).toEqual(invalidPasswordMessage);
          done();
        }
      });

    service.send({ type: AuthEvents.Login, loginFn });
  });

  it('types email, types password, fails to log in', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest
      .fn()
      .mockRejectedValue({ reason: new Error(loginFailureMessage) });

    const emailAndPasswordMachine = EmailAndPasswordLoginMachine({
      onLoggedIn,
    });

    const service = interpret(emailAndPasswordMachine)
      .start()
      .onTransition(current => {
        if (current.event.type === AuthEvents.TypeEmail) {
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

    service.send({ type: AuthEvents.TypeEmail, value: testEmail });
  });
});
