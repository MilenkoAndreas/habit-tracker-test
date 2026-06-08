import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!error && user) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setAuthLoading(false);
        });
      } else {
        setSession(null);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    const needsConfirmation = !error && !data.session;
    return { error, needsConfirmation };
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const sendResetCode = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    return { error };
  };

  const verifyResetCode = async (email, code) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (!error) setNeedsPasswordReset(true);
    return { error };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setNeedsPasswordReset(false);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session, authLoading,
      signUp, signIn, signOut,
      sendResetCode, verifyResetCode,
      updatePassword, needsPasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
