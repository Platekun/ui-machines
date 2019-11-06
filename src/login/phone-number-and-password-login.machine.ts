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
  phoneNumber: string;
}

export const TypePhoneNumber = 'TYPE_PHONE_NUMBER';
interface TypePhoneNumber {
  type: typeof TypePhoneNumber;
  value: string;
}

type LoginOpts = Pick<IAuthMachineContext, 'phoneNumber' | 'password'>;
const setPhoneNumber = 'setPhoneNumber';

type IAuthMachineEvent = TypePhoneNumber | IAuthBaseEvent<LoginOpts>;

function validPhoneNumber(phoneNumber: string, region: string) {
  return new Validator().isPhoneNumber(phoneNumber, region);
}

export const INVALID_PHONE_NUMBER_MESSAGE = 'Phone number is not valid';

interface IPhoneNumberAndPasswordLoginFactoryOptions
  extends IAuthFactoryOptions {
  /**
   * Country code of the Phone Number to be used
   */
  region: string;
  invalidPhoneNumberMessage?: string;
}

export function PhoneNumberPasswordLoginMachine(
  opts: IPhoneNumberAndPasswordLoginFactoryOptions
) {
  return Machine<IAuthMachineContext, IAuthMachineStates, IAuthMachineEvent>(
    {
      id: 'Login machine with username and password',
      initial: IdleState,
      context: {
        phoneNumber: '',
        password: '',
        formErrors: null,
        loginError: null,
      },
      states: {
        [IdleState]: {
          on: {
            [TypePhoneNumber]: {
              actions: [setPhoneNumber],
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
                phoneNumber: ctx.phoneNumber,
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
        [setPhoneNumber]: assign<IAuthMachineContext, IAuthMachineEvent>({
          phoneNumber: (_ctx, e) => (e as TypePhoneNumber).value,
        }),
        [setPasswordAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          password: (_ctx, e) => (e as TypePasswordEvent).value,
        }),
        [setFormErrorAction]: assign<IAuthMachineContext, IAuthMachineEvent>({
          formErrors: (ctx: IAuthMachineContext) => {
            let errors: Array<Error> = [];

            if (!validPhoneNumber(ctx.phoneNumber, opts.region)) {
              errors.push(
                new Error(
                  opts.invalidPhoneNumberMessage || INVALID_PHONE_NUMBER_MESSAGE
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
          validPhoneNumber(ctx.phoneNumber, opts.region) &&
          validPassword(ctx.password),
      },
    }
  );
}
