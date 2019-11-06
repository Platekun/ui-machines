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
  IAuthFactoryOptions,
  whenLoggedInAction,
  INVALID_PASSWORD_MESSAGE,
} from './common';

interface IAuthMachineContext extends IAuthMachineBaseContext {
  email: string;
}

export const TypeEmailEvent = 'TYPE_EMAIL';
interface TypeEmailEvent {
  type: typeof TypeEmailEvent;
  value: string;
}

type LoginOpts = Pick<IAuthMachineContext, 'email' | 'password'>;
const setEmailAction = 'setEmail';

type IAuthMachineEvent = TypeEmailEvent | IAuthBaseEvent<LoginOpts>;

function validEmail(email: string) {
  return new Validator().isEmail(email);
}

export const INVALID_EMAIL_MESSAGE = 'Email is not valid';

interface IEmailAndPasswordLoginFactoryOptions extends IAuthFactoryOptions {
  invalidEmailMessage?: string;
}

export function EmailAndPasswordLoginMachine(
  opts: IEmailAndPasswordLoginFactoryOptions
) {
  return Machine<IAuthMachineContext, IAuthMachineStates, IAuthMachineEvent>(
    {
      id: 'Login machine with username and password',
      initial: IdleState,
      context: {
        email: '',
        password: '',
        formErrors: null,
        loginError: null,
      },
      states: {
        [IdleState]: {
          on: {
            [TypeEmailEvent]: {
              actions: [setEmailAction],
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
                email: ctx.email,
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
        [setEmailAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          email: (_ctx, e) => (e as TypeEmailEvent).value,
        }),
        [setPasswordAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          password: (_ctx, e) => (e as TypePasswordEvent).value,
        }),
        [setFormErrorAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          formErrors: (ctx: IAuthMachineContext) => {
            let errors: Array<Error> = [];

            if (!validEmail(ctx.email)) {
              errors.push(
                new Error(opts.invalidEmailMessage || INVALID_EMAIL_MESSAGE)
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
          validEmail(ctx.email) && validPassword(ctx.password),
      },
    }
  );
}
