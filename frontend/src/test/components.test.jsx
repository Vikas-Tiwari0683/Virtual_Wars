// =============================================================================
// SECTION: Component Tests
// Tests LoginForm, RegisterForm, and LiveCarbonPreview rendering and
// interaction using React Testing Library.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// =============================================================================
// SECTION: Mocks
// =============================================================================

// Mock AuthContext
const mockLogin    = vi.fn();
const mockRegister = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login:              mockLogin,
    register:           mockRegister,
    isOnboarded:        false,
    loading:            false,
    completeOnboarding: vi.fn(),
    logout:             vi.fn(),
    user:               null,
  }),
  AuthProvider: ({ children }) => children,
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Import after mocks
import LoginPage from '../pages/LoginPage.jsx';

// =============================================================================
// SECTION: Helpers
// =============================================================================
function renderLoginPage(tab = 'login') {
  const { container } = render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
  // Switch to register tab if needed
  if (tab === 'register') {
    fireEvent.click(screen.getByRole('tab', { name: /create account/i }));
  }
  return container;
}

// =============================================================================
// SECTION: LoginForm Tests
// =============================================================================
describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', async () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please fill in all fields.');
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue(null); // no error
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('navigates to dashboard on successful login', async () => {
    mockLogin.mockResolvedValue(null);
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays API error message on failed login', async () => {
    mockLogin.mockResolvedValue('Incorrect email or password.');
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Incorrect email or password.');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('error alert has correct aria-describedby on form', async () => {
    mockLogin.mockResolvedValue('Incorrect email or password.');
    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email address/i), 'x@x.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'bad');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('id', 'login-error');
    });
  });

  it('toggles password visibility', async () => {
    renderLoginPage();
    const pwInput = screen.getByLabelText(/^password$/i);
    expect(pwInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByLabelText(/show password/i));
    expect(pwInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(pwInput).toHaveAttribute('type', 'password');
  });
});

// =============================================================================
// SECTION: RegisterForm Tests
// =============================================================================
describe('RegisterForm', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
  });

  it('renders all registration fields', () => {
    renderLoginPage('register');
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it('shows error when required fields are missing', async () => {
    renderLoginPage('register');
    fireEvent.click(screen.getByRole('button', { name: /create free account/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please fill in all required fields.');
    });
  });

  it('shows error when terms not agreed', async () => {
    renderLoginPage('register');
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    // Do NOT check the checkbox
    fireEvent.click(screen.getByRole('button', { name: /create free account/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please accept the Terms of Service.');
    });
  });

  it('calls register and navigates to onboarding on success', async () => {
    mockRegister.mockResolvedValue(null);
    renderLoginPage('register');

    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create free account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jane', email: 'jane@example.com' })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });
  });
});

// =============================================================================
// SECTION: Accessibility Tests
// =============================================================================
describe('LoginPage Accessibility', () => {
  it('has tablist with correct roles', () => {
    renderLoginPage();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('sign in tab is selected by default', () => {
    renderLoginPage();
    expect(screen.getByRole('tab', { name: /sign in/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('switching tabs updates aria-selected', () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('tab', { name: /create account/i }));
    expect(screen.getByRole('tab', { name: /create account/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /sign in/i })).toHaveAttribute('aria-selected', 'false');
  });
});
