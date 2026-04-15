export interface AuthError {
  code?: string;
  message: string;
}
import { User } from 'firebase/auth';

export type FirebaseUser = User;

export interface AuthError {
  code?: string;
  message: string;
}
