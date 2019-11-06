export interface IAuthMachineBaseContext {
  formErrors: Array<Error> | null;
  loginError: Error | null;
  password: string;
}
