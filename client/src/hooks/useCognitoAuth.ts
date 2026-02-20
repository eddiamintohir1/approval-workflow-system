import { useState, useEffect } from 'react';
import { cognitoAuth, CognitoAuthUser } from '@/lib/cognito';

export function useCognitoAuth() {
  const [user, setUser] = useState<CognitoAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('🔍 Checking Cognito user...');
        const currentUser = await cognitoAuth.getCurrentUser();
        console.log('👤 Current user:', currentUser ? currentUser.email : 'null');
        setUser(currentUser);
      } catch (error) {
        console.error('❌ Error checking Cognito user:', error);
        setUser(null);
      } finally {
        console.log('✅ Auth loading complete, user:', user ? 'present' : 'null');
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
