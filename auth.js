/* ═══════════════════════════════════════════════════════════
   auth.js – Firebase Authentication + Firestore for EcoQuest
   Supports: Email/Password, Google Sign-In, User Profiles
   ═══════════════════════════════════════════════════════════ */

// ── Firebase Config ──
const firebaseConfig = {
  apiKey: "AIzaSyCbYQGIBkkk4kOvYZxrnAD5gi48fcgd5fg",
  authDomain: "test-1253b.firebaseapp.com",
  projectId: "test-1253b",
  storageBucket: "test-1253b.firebasestorage.app",
  messagingSenderId: "389734130928",
  appId: "1:389734130928:web:7dea1c73f1a1ebb7c60e35",
  measurementId: "G-KV4LP735F8"
};

// Initialize Firebase (compat SDK)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const fbAuth = firebase.auth();
const fbDb   = firebase.firestore();

// ── Auth Module ──
const Auth = {

  /** ── Listeners ── */
  _unsubProfile: null,

  /** Check if user is currently logged in (sync) */
  isLoggedIn() {
    if (fbAuth.currentUser) return true;
    return localStorage.getItem('eq_logged_in') === 'true';
  },

  /** Get current user info */
  getUser() {
    const user = fbAuth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        name: user.displayName || 'EcoUser',
        email: user.email,
        photoURL: user.photoURL || null,
        initials: Auth._initials(user.displayName || user.email)
      };
    }
    const stored = localStorage.getItem('eq_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* ignore */ }
    }
    return { uid: '', name: 'EcoUser', email: '', initials: 'EU' };
  },

  // ═══════════════════════════════════════════
  // Authentication Methods
  // ═══════════════════════════════════════════

  /**
   * Sign in with Email & Password
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  async login(email, password) {
    try {
      const cred = await fbAuth.signInWithEmailAndPassword(email, password);
      await Auth._onSignIn(cred.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: Auth._friendlyError(err.code) };
    }
  },

  /**
   * Create account with Email & Password
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  async register(name, email, password) {
    try {
      const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      // Create Firestore user profile
      await Auth._createUserProfile(cred.user, { name });
      await Auth._onSignIn(cred.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: Auth._friendlyError(err.code) };
    }
  },

  /**
   * Sign in with Google popup
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await fbAuth.signInWithPopup(provider);
      const user = result.user;
      const isNewUser = result.additionalUserInfo?.isNewUser;

      // Create profile in Firestore for new users
      if (isNewUser) {
        await Auth._createUserProfile(user, {
          name: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        // Update last login for existing users
        await Auth._updateLastLogin(user.uid);
      }

      await Auth._onSignIn(user);
      return { ok: true };
    } catch (err) {
      // User closed the popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return { ok: false, error: 'Sign-in cancelled.' };
      }
      return { ok: false, error: Auth._friendlyError(err.code) };
    }
  },

  /** Sign out and redirect */
  logout() {
    if (Auth._unsubProfile) {
      Auth._unsubProfile();
      Auth._unsubProfile = null;
    }
    fbAuth.signOut().catch(() => {});
    localStorage.removeItem('eq_logged_in');
    localStorage.removeItem('eq_user');
    localStorage.removeItem('eq_user_profile');
    window.location.href = 'login.html';
  },

  /** Redirect to login page if not authenticated */
  guard() {
    if (Auth.isLoggedIn()) {
      Auth._syncNavbar();
      Auth._listenProfile();
      return;
    }
    fbAuth.onAuthStateChanged((user) => {
      if (user) {
        Auth._onSignIn(user);
        Auth._syncNavbar();
        Auth._listenProfile();
      } else if (!localStorage.getItem('eq_logged_in')) {
        window.location.href = 'login.html';
      }
    });
  },

  // ═══════════════════════════════════════════
  // Firestore – User Profile
  // ═══════════════════════════════════════════

  /** Create a new user profile document in Firestore */
  async _createUserProfile(user, extra = {}) {
    try {
      const userRef = fbDb.collection('users').doc(user.uid);
      await userRef.set({
        uid: user.uid,
        name: extra.name || user.displayName || 'EcoUser',
        email: user.email,
        photoURL: extra.photoURL || user.photoURL || null,
        phone: null,
        college: null,
        totalXP: 0,
        level: 'Seedling',
        badges: [],
        quizzesCompleted: 0,
        missionsCompleted: 0,
        co2Saved: 0,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore profile creation skipped:', err.message);
    }
  },

  /** Update the lastLoginAt timestamp */
  async _updateLastLogin(uid) {
    try {
      await fbDb.collection('users').doc(uid).update({
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      // Profile may not exist yet, create it
      console.warn('Firestore update skipped:', err.message);
    }
  },

  /** Listen to real-time profile changes from Firestore */
  _listenProfile() {
    const user = fbAuth.currentUser;
    if (!user || Auth._unsubProfile) return;

    Auth._unsubProfile = fbDb.collection('users').doc(user.uid)
      .onSnapshot((snap) => {
        if (snap.exists) {
          const data = snap.data();
          localStorage.setItem('eq_user_profile', JSON.stringify(data));
          // Sync profile-complete state
          Auth._profileComplete = !!(data.phone && data.college);
        }
      }, (err) => {
        console.warn('Profile listener error:', err.message);
      });
  },

  /** Get Firestore user profile data */
  getProfile() {
    const stored = localStorage.getItem('eq_user_profile');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* ignore */ }
    }
    return null;
  },

  /** Whether the user profile is complete (phone + college filled) */
  isProfileComplete() {
    return Auth._profileComplete || false;
  },

  // ═══════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════

  async _onSignIn(user) {
    Auth._persist(user);
  },

  _persist(user) {
    localStorage.setItem('eq_logged_in', 'true');
    localStorage.setItem('eq_user', JSON.stringify({
      uid: user.uid,
      name: user.displayName || 'EcoUser',
      email: user.email,
      photoURL: user.photoURL || null,
      initials: Auth._initials(user.displayName || user.email)
    }));
  },

  _initials(str) {
    if (!str) return 'EU';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
  },

  _syncNavbar() {
    const user = Auth.getUser();
    const avatar = document.getElementById('nav-avatar');
    if (avatar) {
      if (user.photoURL) {
        avatar.innerHTML = `<img src="${user.photoURL}" alt="${user.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
      } else {
        avatar.textContent = user.initials;
      }
    }
  },

  _friendlyError(code) {
    const map = {
      'auth/user-not-found':            'No account found with this email.',
      'auth/wrong-password':            'Incorrect password. Please try again.',
      'auth/invalid-email':             'Please enter a valid email address.',
      'auth/email-already-in-use':      'An account with this email already exists.',
      'auth/weak-password':             'Password should be at least 6 characters.',
      'auth/too-many-requests':         'Too many attempts. Please try again later.',
      'auth/network-request-failed':    'Network error. Check your connection.',
      'auth/invalid-credential':        'Invalid email or password.',
      'auth/invalid-login-credentials': 'Invalid email or password.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
      'auth/popup-blocked':             'Popup was blocked by your browser. Please allow popups.',
      'auth/operation-not-allowed':     'This sign-in method is not enabled. Please contact support.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  },

  _profileComplete: false,
};
