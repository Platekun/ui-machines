import { Machine, assign } from 'xstate';
import { Validator } from 'class-validator';

import {
  IAuthMachineBaseContext,
  IAuthMachineStates,
  IdleState,
  LoggingInState,
  LoggedInState,
  TypePasswordEvent,
  deleteFormErrorAction,
  deleteLoginErrorAction,
  setFormErrorAction,
  setLoginErrorAction,
  IAuthBaseEvent,
  LoginFailureEvent,
  formIsValidGuard,
  setPasswordAction,
  LoginEvent,
  validPassword,
  whenLoggedInAction,
  IAuthFactoryOptions,
  INVALID_PASSWORD_MESSAGE,
} from './common';

interface IAuthMachineContext extends IAuthMachineBaseContext {
  username: string;
}

export const TypeUsernameEvent = 'TYPE_USERNAME';
interface TypeUsernameEvent {
  type: typeof TypeUsernameEvent;
  value: string;
}

type LoginOpts = Pick<IAuthMachineContext, 'username' | 'password'>;
const setUsernameAction = 'setUsername';

type IAuthMachineEvent = TypeUsernameEvent | IAuthBaseEvent<LoginOpts>;

function validUsername(username: string) {
  return new Validator().isNotEmpty(username);
}

export const INVALID_USERNAME_MESSAGE = 'Username is not valid';

interface IUsernameAndPasswordLoginFactoryOptions extends IAuthFactoryOptions {
  invalidUsernameMessage?: string;
}

export function UserNameAndPasswordLoginMachine(
  opts: IUsernameAndPasswordLoginFactoryOptions
) {
  return Machine<IAuthMachineContext, IAuthMachineStates, IAuthMachineEvent>(
    {
      id: 'Login machine with username and password',
      initial: IdleState,
      context: {
        username: '',
        password: '',
        formErrors: null,
        loginError: null,
      },
      states: {
        [IdleState]: {
          on: {
            [TypeUsernameEvent]: {
              actions: [setUsernameAction],
            },
            [TypePasswordEvent]: {
              actions: [setPasswordAction],
            },
            [LoginEvent]: [
              {
                target: LoggingInState,
                actions: [deleteFormErrorAction, deleteLoginErrorAction],
                cond: formIsValidGuard,
              },
              {
                actions: [setFormErrorAction],
              },
            ],
          },
        },
        [LoggingInState]: {
          invoke: {
            id: 'Login',
            src: (ctx: IAuthMachineContext, e) =>
              (e as LoginEvent<LoginOpts>).loginFn({
                username: ctx.username,
                password: ctx.password,
              }),
            onDone: {
              target: LoggedInState,
              actions: [whenLoggedInAction],
            },
            onError: {
              target: IdleState,
              actions: [setLoginErrorAction],
            },
          },
        },
        [LoggedInState]: {
          type: 'final',
        },
      },
    },
    {
      actions: {
        [setUsernameAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          username: (_ctx, e) => (e as TypeUsernameEvent).value,
        }),
        [setPasswordAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          password: (_ctx, e) => (e as TypePasswordEvent).value,
        }),
        [setFormErrorAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          formErrors: (ctx: IAuthMachineContext) => {
            let errors: Array<Error> = [];

            if (!validUsername(ctx.username)) {
              errors.push(
                new Error(
                  opts.invalidUsernameMessage || INVALID_USERNAME_MESSAGE
                )
              );
            }

            if (!validPassword(ctx.password)) {
              errors.push(
                new Error(
                  opts.invalidPasswordMessage || INVALID_PASSWORD_MESSAGE
                )
              );
            }

            return errors;
          },
        }),
        [deleteFormErrorAction]: assign<IAuthMachineContext, IAuthMachineEvent>(
          {
            formErrors: null,
          }
        ),
        [setLoginErrorAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          loginError: (_ctx, e) => (e as LoginFailureEvent).data.reason,
        }),
        [deleteLoginErrorAction]: assign<
          IAuthMachineContext,
          IAuthMachineEvent
        >({
          loginError: null,
        }),
        [whenLoggedInAction]: opts.onLoggedIn,
      },
      guards: {
        [formIsValidGuard]: (ctx: IAuthMachineContext) =>
          validUsername(ctx.username) && validPassword(ctx.password),
      },
    }
  );
}
