import { Validator } from 'class-validator';

export const formIsValidGuard = 'formIsValidGuard';

export function validPassword(pwd: string) {
  return new Validator().isNotEmpty(pwd);
}
