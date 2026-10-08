import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged 
} from '../services/firebase';
import { setAuthToken, api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync session and verify token with backend
  const syncBackendUser = async (token, fallbackUserInfo = null) => {
    setAuthToken(token);
    try {
      const res = await api.verifyToken();
      setCurrentUser(res.user);
      setOnboardingCompleted(res.onboarding_completed);
      return res;
    } catch (err) {
      console.warn("Backend token verification failed, using client session:", err);
      if (fallbackUserInfo) {
        setCurrentUser(fallbackUserInfo);
      }
    }
  };

  useEffect(() => {
    // 1. Check if mock/demo session stored locally
    const savedDemoUser = localStorage.getItem('fitquest_demo_user');
    const savedToken = localStorage.getItem('fitquest_token');

    if (savedDemoUser && savedToken) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setCurrentUser(parsed);
        syncBackendUser(savedToken, parsed).finally(() => setLoading(false));
        return;
      } catch (e) {}
    }

    // 2. Firebase live auth listener
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const token = await fbUser.getIdToken();
            const fallbackInfo = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'Athlete',
              email: fbUser.email,
              photo_url: fbUser.photoURL || ''
            };
            await syncBackendUser(token, fallbackInfo);
          } catch (e) {
            console.error("Error retrieving token:", e);
          }
        } else if (!savedToken) {
          setCurrentUser(null);
          setAuthToken('');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // Email / Password Registration
  const signupWithEmail = async (email, password, name) => {
    setAuthError(null);
    try {
      if (auth && import.meta.env.VITE_FIREBASE_API_KEY) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        await syncBackendUser(token, { uid: cred.user.uid, name: name || 'Athlete', email });
        // Update user profile in backend with name
        await api.updateProfile({ name });
      } else {
        // Fallback local auth simulation
        const demoUid = `user_${Date.now().toString(36)}`;
        const demoToken = `dev-token-${demoUid}`;
        const demoUser = { uid: demoUid, name: name || 'Athlete', email, photo_url: '' };
        localStorage.setItem('fitquest_demo_user', JSON.stringify(demoUser));
        await syncBackendUser(demoToken, demoUser);
        await api.updateProfile({ name });
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Email / Password Login
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      if (auth && import.meta.env.VITE_FIREBASE_API_KEY) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        await syncBackendUser(token, { uid: cred.user.uid, email });
      } else {
        const demoUid = `user_${Math.abs(email.split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0)) % 100000}`;
        const demoToken = `dev-token-${demoUid}`;
        const demoUser = { uid: demoUid, name: email.split('@')[0], email, photo_url: '' };
        localStorage.setItem('fitquest_demo_user', JSON.stringify(demoUser));
        await syncBackendUser(demoToken, demoUser);
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Google Sign In
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      if (auth && googleProvider && import.meta.env.VITE_FIREBASE_API_KEY) {
        const res = await signInWithPopup(auth, googleProvider);
        const token = await res.user.getIdToken();
        await syncBackendUser(token, {
          uid: res.user.uid,
          name: res.user.displayName,
          email: res.user.email,
          photo_url: res.user.photoURL
        });
      } else {
        // Instant simulated Google login for quick testing
        const demoUid = `google_user_${Date.now().toString(36)}`;
        const demoToken = `dev-token-${demoUid}`;
        const demoUser = { uid: demoUid, name: 'Alex Rivera', email: 'alex@fitquest.ai', photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
        localStorage.setItem('fitquest_demo_user', JSON.stringify(demoUser));
        await syncBackendUser(demoToken, demoUser);
        await api.updateProfile({ name: 'Alex Rivera' });
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // Quick Demo Login for instant zero-friction preview
  const loginAsDemo = async (name = "Jordan Lee") => {
    const demoUid = `user_demo_${Date.now().toString(36)}`;
    const demoToken = `dev-token-${demoUid}`;
    const demoUser = {
      uid: demoUid,
      name,
      email: `${name.toLowerCase().replace(' ', '')}@fitquest.ai`,
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    };
    localStorage.setItem('fitquest_demo_user', JSON.stringify(demoUser));
    await syncBackendUser(demoToken, demoUser);
  };

  // Logout
  const logout = async () => {
    try {
      if (auth) {
        await fbSignOut(auth).catch(() => {});
      }
    } finally {
      localStorage.removeItem('fitquest_demo_user');
      setAuthToken('');
      setCurrentUser(null);
      setOnboardingCompleted(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      onboardingCompleted,
      setOnboardingCompleted,
      authError,
      signupWithEmail,
      loginWithEmail,
      loginWithGoogle,
      loginAsDemo,
      logout,
      syncBackendUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
