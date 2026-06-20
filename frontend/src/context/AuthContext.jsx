// =============================================================================
// SECTION: Auth Context
// Authentication is handled entirely by Firebase Auth (email + password).
// On every API call, the current Firebase ID token is sent as Bearer.
// The backend (Firebase Admin SDK) verifies the token and auto-creates
// the Neon user row on first login.
// =============================================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  signUpWithEmail,
  signInWithEmail,
  logOut as firebaseLogOut,
  subscribeToAuthChanges,
} from '../services/firebase/authService';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// =============================================================================
// SECTION: AuthProvider
// =============================================================================
export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading,     setLoading]     = useState(true); // true until Firebase resolves

  // -------------------------------------------------------------------------
  // Subscribe to Firebase auth state — single source of truth.
  // Fires immediately with the current user (or null) on mount.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        // Persist minimal user shape in state
        setUser({
          uid:   firebaseUser.uid,
          name:  firebaseUser.displayName,   // Firebase User uses .displayName, not .name
          email: firebaseUser.email,
        });

        // Check onboarded status from Neon via backend
        // (token is refreshed automatically by Firebase before this runs)
        try {
          const { data } = await authAPI.me();
          if (data?.isOnboarded) setIsOnboarded(true);
        } catch {
          // Backend unreachable — leave isOnboarded as false
        }
      } else {
        setUser(null);
        setIsOnboarded(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // -------------------------------------------------------------------------
  // register — Firebase creates the account, then the backend auto-creates
  // the Neon row on the next authenticated API call.
  // -------------------------------------------------------------------------
  const register = useCallback(async ({ firstName, lastName, email, password }) => {
    const { user: fbUser, error } = await signUpWithEmail(firstName, lastName, email, password);
    if (error) return error;

    setUser({
      uid:   fbUser.uid,
      name:  fbUser.displayName,
      email: fbUser.email,
    });
    return null; // no error
  }, []);

  // -------------------------------------------------------------------------
  // login — Firebase verifies credentials and returns the user.
  const login = useCallback(async (email, password) => {
    const { user: fbUser, error } = await signInWithEmail(email, password);
    if (error) return error;

    setUser({
      uid:   fbUser.uid,
      name:  fbUser.displayName,
      email: fbUser.email,
    });

    // isOnboarded is set by subscribeToAuthChanges → authAPI.me()
    // No need to call it again here — avoids race condition.
    return null;
  }, []);

  // -------------------------------------------------------------------------
  // completeOnboarding — calls PATCH /api/auth/onboard
  // -------------------------------------------------------------------------
  const completeOnboarding = useCallback(async (lifestyle = 'transit') => {
    await authAPI.onboard({ lifestyle });
    setIsOnboarded(true);
  }, []);

  // -------------------------------------------------------------------------
  // logout — Firebase signs out, state clears via subscribeToAuthChanges
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    await firebaseLogOut();
    // subscribeToAuthChanges fires with null → clears user + isOnboarded
  }, []);

  const value = { user, isOnboarded, loading, login, register, completeOnboarding, logout };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until Firebase has resolved auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// SECTION: useAuth Hook
// =============================================================================
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
