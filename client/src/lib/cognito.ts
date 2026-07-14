import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

// Cognito pool and app client IDs are public application identifiers. Keeping
// the current production IDs as fallbacks prevents a missing Vercel build-time
// variable from turning the entire application into a blank page.
const poolData = {
  UserPoolId:
    import.meta.env.VITE_COGNITO_USER_POOL_ID ||
    "ap-southeast-1_spVxra543",
  ClientId:
    import.meta.env.VITE_COGNITO_CLIENT_ID ||
    "1ipgf1ad3mdft7mdott6c60230",
};

export const userPool = new CognitoUserPool(poolData);

export interface CognitoAuthUser {
  email: string;
  sub: string;
  idToken: string;
  fullName?: string;
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
      // Helper function to attempt authentication with a given username
      const attemptAuth = (username: string): Promise<CognitoAuthUser> => {
        return new Promise((resolveAttempt, rejectAttempt) => {
          const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
          });

          const cognitoUser = new CognitoUser({
            Username: username,
            Pool: userPool,
          });

          cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result: any) => {
              const idToken = result.getIdToken().getJwtToken();
              const payload = result.getIdToken().payload;

              resolveAttempt({
                email: payload.email,
                sub: payload.sub,
                idToken,
                fullName: payload.name || payload.email,
              });
            },
            onFailure: (err: any) => {
              rejectAttempt(err);
            },
          });
        });
      };

      // First, try with the email as-is
      attemptAuth(email)
        .then(resolve)
        .catch((err) => {
          // If that fails, try converting email to hyphenated username format
          // e.g., eddie.amintohir@compawnion.co -> eddie-amintohir
          const hyphenatedUsername = email.split('@')[0].replace(/\./g, '-');
          
          if (hyphenatedUsername !== email) {
            console.log(`First attempt failed, trying with username: ${hyphenatedUsername}`);
            attemptAuth(hyphenatedUsername)
              .then(resolve)
              .catch(() => {
                // If both attempts fail, reject with the original error
                reject(err);
              });
          } else {
            // No alternative format to try
            reject(err);
          }
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
          fullName: payload.name || payload.email,
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
