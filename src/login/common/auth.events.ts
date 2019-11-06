export const TypePasswordEvent = 'TYPE_PASSWORD';
export interface TypePasswordEvent {
  type: typeof TypePasswordEvent;
  value: string;
}

export const LoginEvent = 'LOG_IN';
export interface LoginEvent<LoginOpts> {
  type: typeof LoginEvent;
  loginFn: (opts: LoginOpts) => Promise<any>;
}

export interface LoginFailureEvent {
  type: 'error.execution';
  data: {
    reason: Error;
  };
}

export type IAuthBaseEvent<LoginOpts> =
  | TypePasswordEvent
  | LoginEvent<LoginOpts>
  | LoginFailureEvent;
