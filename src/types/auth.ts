export interface AuthError {
  code?: string;
  message: string;
}

export interface FirebaseUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  reload: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}
