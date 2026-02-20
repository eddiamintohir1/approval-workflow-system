import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

export const userPool = new CognitoUserPool(poolData);

export interface CognitoAuthUser {
  email: string;
  sub: string;
  idToken: string;
}

export const cognitoAuth = {
  // Sign up new user
  signUp: (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ];

      userPool.signUp(email, password, attributeList, [], (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  },

  // Sign in user
  signIn: (email: string, password: string): Promise<CognitoAuthUser> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result: any) => {
          const idToken = result.getIdToken().getJwtToken();
          const payload = result.getIdToken().payload;

          resolve({
            email: payload.email,
            sub: payload.sub,
            idToken,
          });
        },
        onFailure: (err: any) => {
          reject(err);
        },
      });
    });
  },

  // Sign out user
  signOut: (): void => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  },

  // Get current user
  getCurrentUser: (): Promise<CognitoAuthUser | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err || !session.isValid()) {
          resolve(null);
          return;
        }

        const idToken = session.getIdToken().getJwtToken();
        const payload = session.getIdToken().payload;

        resolve({
          email: payload.email,
          sub: payload.sub,
          idToken,
        });
      });
    });
  },

  // Get ID token for API calls
  getIdToken: (): Promise<string | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | null, session: any) => {
        if (err || !session.isValid()) {
          resolve(null);
          return;
        }

        resolve(session.getIdToken().getJwtToken());
      });
    });
  },
};
