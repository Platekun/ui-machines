import { interpret } from 'xstate';

import {
  UserNameAndPasswordLoginMachine,
  AuthEvents,
  AuthStates,
} from '../src';
import { INVALID_PASSWORD_MESSAGE } from '../src/login/common';
import { INVALID_USERNAME_MESSAGE } from '../src/login/username-and-password-login.machine';

const testUsername = 'JohnDoe';
const testPassword = 'I Love Cookies';
const invalidUsernameMessage = 'You cannot use that user name';
const invalidPasswordMessage = 'You cannot use that password';
const loginFailureMessage = 'Woops. Login Failed for some reason';

describe('Username and Password Login Machine', () => {
  it('types username, types password and logs in', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn().mockImplementation(({ username, password }) => {
      expect(username).toBe(testUsername);
      expect(password).toBe(testPassword);

      return Promise.resolve();
    });

    const userNameAndPasswordLoginMachine = UserNameAndPasswordLoginMachine({
      onLoggedIn,
    });

    const service = interpret(userNameAndPasswordLoginMachine)
      .start()
      .onTransition(current => {
        if (current.event.type === AuthEvents.TypeUsername) {
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

    service.send({ type: AuthEvents.TypeUsername, value: testUsername });
  });

  it('prevents from logging in with invalid parameters', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn();

    const userNameAndPasswordLoginMachine = UserNameAndPasswordLoginMachine({
      onLoggedIn,
    });

    const service = interpret(userNameAndPasswordLoginMachine)
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
          ).toEqual(INVALID_USERNAME_MESSAGE);
          expect(
            (current.context.formErrors as Array<Error>)[1].message
          ).toEqual(INVALID_PASSWORD_MESSAGE);
          done();
        }
      });

    service.send({ type: AuthEvents.Login, loginFn });
  });

  it('allows custom error messages for invalid username and password', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest.fn();

    const userNameAndPasswordLoginMachine = UserNameAndPasswordLoginMachine({
      onLoggedIn,
      invalidUsernameMessage,
      invalidPasswordMessage,
    });

    const service = interpret(userNameAndPasswordLoginMachine)
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
          ).toEqual(invalidUsernameMessage);
          expect(
            (current.context.formErrors as Array<Error>)[1].message
          ).toEqual(invalidPasswordMessage);
          done();
        }
      });

    service.send({ type: AuthEvents.Login, loginFn });
  });

  it('types username, types password, fails to log in', done => {
    const onLoggedIn = jest.fn().mockImplementation();
    const loginFn = jest
      .fn()
      .mockRejectedValue({ reason: new Error(loginFailureMessage) });

    const userNameAndPasswordLoginMachine = UserNameAndPasswordLoginMachine({
      onLoggedIn,
    });

    const service = interpret(userNameAndPasswordLoginMachine)
      .start()
      .onTransition(current => {
        if (current.event.type === AuthEvents.TypeUsername) {
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

    service.send({ type: AuthEvents.TypeUsername, value: testUsername });
  });
});
