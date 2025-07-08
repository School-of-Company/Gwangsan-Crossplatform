type AuthConfig = {
  signInPage: string;
  protectedPages: readonly string[];
  publicPages: readonly string[];
};

export const authConfig: AuthConfig = {
  signInPage: '/signin',
  protectedPages: [''],
  publicPages: ['/signin', '/'],
} as const;
