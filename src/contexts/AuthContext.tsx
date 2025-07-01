import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        console.log('AuthProvider: Checking for existing session...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthProvider: Session error:', sessionError);
          throw sessionError;
        }

        if (mounted) {
          console.log('AuthProvider: Initial session:', initialSession ? 'Found' : 'Not found');
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }

        console.log('AuthProvider: Setting up auth state listener...');
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (mounted) {
              console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
              setSession(session);
              setUser(session?.user ?? null);
              setLoading(false);
            }
          }
        );

        subscription = sub;
      } catch (err) {
        console.error('AuthProvider: Initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize auth'));
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      console.log('AuthProvider: Cleaning up...');
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      console.log('AuthProvider: Signing up user:', email);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        console.error('AuthProvider: Sign up error:', error);
      } else {
        console.log('AuthProvider: Sign up successful');
      }
      
      return { error };
    } catch (err) {
      console.error('AuthProvider: Sign up error:', err);
      return { error: err as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing in user:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('AuthProvider: Sign in error:', error);
      } else {
        console.log('AuthProvider: Sign in successful');
      }
      
      return { error };
    } catch (err) {
      console.error('AuthProvider: Sign in error:', err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out user');
      await supabase.auth.signOut();
      console.log('AuthProvider: Sign out successful');
    } catch (err) {
      console.error('AuthProvider: Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut
  };

  // If there's an error, still render the app but with error state
  if (error) {
    console.warn('AuthProvider: Error state:', error);
  }

  console.log('AuthProvider: Current state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    hasError: !!error
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
