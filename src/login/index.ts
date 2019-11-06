import { IdleState, LoggingInState, LoggedInState } from './common/auth.states';
import { LoginEvent, TypePasswordEvent } from './common/auth.events';
import { TypeUsernameEvent } from './username-and-password-login.machine';
import { TypePhoneNumber } from './phone-number-and-password-login.machine';
import { TypeEmailEvent } from './email-and-password-login.machine';

export const AuthEvents: {
  Login: typeof LoginEvent;
  TypePassword: typeof TypePasswordEvent;
  TypeUsername: typeof TypeUsernameEvent;
  TypePhoneNumber: typeof TypePhoneNumber;
  TypeEmail: typeof TypeEmailEvent;
} = {
  Login: LoginEvent,
  TypePassword: TypePasswordEvent,
  TypeUsername: TypeUsernameEvent,
  TypePhoneNumber: TypePhoneNumber,
  TypeEmail: TypeEmailEvent,
};

export const AuthStates: {
  Idle: typeof IdleState;
  LoggingIn: typeof LoggingInState;
  LoggedIn: typeof LoggedInState;
} = {
  Idle: IdleState,
  LoggingIn: LoggingInState,
  LoggedIn: LoggedInState,
};

export {
  EmailAndPasswordLoginMachine,
} from './email-and-password-login.machine';
export {
  PhoneNumberPasswordLoginMachine,
} from './phone-number-and-password-login.machine';
export {
  UserNameAndPasswordLoginMachine,
} from './username-and-password-login.machine';
