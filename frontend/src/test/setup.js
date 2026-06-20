// =============================================================================
// SECTION: Vitest global test setup
// Runs before every test file. Adds jest-dom matchers and mocks Firebase
// so tests don't require real credentials.
// =============================================================================

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// React 19 uses the new automatic JSX transform but Vitest's jsdom
// environment needs React in scope. Inject it globally so all component
// files resolve JSX without needing explicit imports.
globalThis.React = React;

// Mock MaterialIcon globally — leaf UI component, not under test
vi.mock('../components/atoms/MaterialIcon', () => ({
  default: ({ name, className, 'aria-hidden': ariaHidden, ...rest }) =>
    React.createElement('span', {
      'data-testid': `icon-${name}`,
      'aria-hidden': ariaHidden,
      className,
      ...rest,
    }),
}));

// --- Mock Firebase so it never tries to connect during tests ---
vi.mock('../services/firebase/config', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(() => () => {}),
  },
  db:               {},
  analyticsPromise: Promise.resolve(null),
  default:          {},
}));

vi.mock('../services/firebase/authService', () => ({
  signUpWithEmail:        vi.fn(),
  signInWithEmail:        vi.fn(),
  logOut:                 vi.fn(),
  subscribeToAuthChanges: vi.fn((cb) => { cb(null); return () => {}; }),
}));
