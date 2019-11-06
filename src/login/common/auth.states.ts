export const IdleState = 'Idle';
export const LoggingInState = 'Logging In';
export const LoggedInState = 'Logged In';

export interface IAuthMachineStates {
  states: {
    [IdleState]: {};
    [LoggingInState]: {};
    [LoggedInState]: {};
  };
}
