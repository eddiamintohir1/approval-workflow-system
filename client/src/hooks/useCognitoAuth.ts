import { useState, useEffect } from 'react';
import { cognitoAuth, CognitoAuthUser } from '@/lib/cognito';

export function useCognitoAuth() {
  const [user, setUser] = useState<CognitoAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await cognitoAuth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking Cognito user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const signOut = () => {
    cognitoAuth.signOut();
    setUser(null);
  };

  return { user, loading, signOut };
}
