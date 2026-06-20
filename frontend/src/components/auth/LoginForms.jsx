// =============================================================================
// SECTION: Auth forms — LoginForm, RegisterForm, PasswordStrengthMeter
// Extracted from LoginPage.jsx to keep the page a thin composition.
// =============================================================================

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import MaterialIcon from '../atoms/MaterialIcon';
import Button from '../atoms/Button';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

// =============================================================================
// PasswordStrengthMeter — segmented bar shown below the register password input.
// =============================================================================
export function PasswordStrengthMeter({ password }) {
  let level = 0;
  if (password.length >= 6) level = 1;
  if (password.length >= 10) level = 2;
  if (password.length >= 12 && /[^a-zA-Z0-9]/.test(password)) level = 3;

  const labels = ['', 'Weak', 'Getting better', 'Strong password'];
  const colors = ['bg-transparent', 'bg-[#ba1a1a]', 'bg-[#8d4b00]', 'bg-[#006b2c]'];
  const widths = ['w-0', 'w-1/3', 'w-2/3', 'w-full'];

  return (
    <div className="mt-2" role="status" aria-live="polite" aria-atomic="true"
      aria-label={password.length > 0 ? `Password strength: ${labels[level]}` : 'Enter a password to see strength'}>
      <div className="h-1.5 w-full bg-[#dce2f7] rounded-full overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full transition-all duration-300 ${colors[level]} ${widths[level]}`} />
      </div>
      {password.length > 0 && (
        <p className={`text-[11px] mt-1 font-medium ${level === 3 ? 'text-[#006b2c]' : level === 2 ? 'text-[#8d4b00]' : 'text-[#ba1a1a]'}`}>
          {labels[level]}
        </p>
      )}
    </div>
  );
}

PasswordStrengthMeter.propTypes = { password: PropTypes.string.isRequired };

// =============================================================================
// LoginForm — email + password, calls context login().
// =============================================================================
export function LoginForm({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading2, setLoading2] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading2(true);
    setError('');
    const err = await login(email, password);
    setLoading2(false);
    if (err) { setError(err); return; }
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div>
      <h2 className="text-4xl font-bold text-[#141b2b] mb-1">Welcome back</h2>
      <p className="text-base text-[#3e4a3d] mb-8">Enter your details to track your footprint.</p>

      {error && (
        <div id="login-error" role="alert" className="mb-4 p-3 bg-[#ffdad6] text-[#93000a] rounded-lg text-sm flex items-center gap-2">
          <MaterialIcon name="error" fill={1} className="text-base" aria-hidden="true" />
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate aria-describedby={error ? 'login-error' : undefined}>
        <div>
          <label htmlFor="login-email" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            id="login-email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
            aria-describedby={error ? 'login-error' : undefined}
            className="w-full px-4 py-3 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] focus:bg-white transition-all placeholder:text-[#bdcaba] text-[#141b2b]"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] focus:bg-white transition-all placeholder:text-[#bdcaba] text-[#141b2b] pr-12"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3e4a3d] hover:text-[#006b2c]"
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              <MaterialIcon name={showPw ? 'visibility_off' : 'visibility'} className="text-xl" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 text-[#006b2c] rounded border-[#bdcaba] focus:ring-[#006b2c]" />
            <span className="text-sm text-[#3e4a3d]">Remember me</span>
          </label>
          <a href="#" className="text-sm text-[#006b2c] font-semibold hover:underline">Forgot password?</a>
        </div>
        <Button type="submit" fullWidth disabled={loading2}>
          {loading2 ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#3e4a3d]">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="text-[#006b2c] font-semibold hover:underline">
          Sign up free
        </button>
      </p>
    </div>
  );
}

LoginForm.propTypes = { onSwitch: PropTypes.func.isRequired };

// =============================================================================
// RegisterForm — full sign-up form with strength meter.
// =============================================================================
export function RegisterForm({ onSwitch }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', country: 'United States', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) { setError('Please fill in all required fields.'); return; }
    if (!agreed) { setError('Please accept the Terms of Service.'); return; }
    setLoading(true);
    setError('');
    const err = await register(form);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate(ROUTES.ONBOARDING);
  };

  const countries = ['United States', 'United Kingdom', 'Germany', 'Norway', 'Canada', 'Australia', 'India', 'France'];

  return (
    <div>
      <h2 className="text-4xl font-bold text-[#141b2b] mb-1">Start your journey</h2>
      <p className="text-base text-[#3e4a3d] mb-8">Join the community driving real environmental impact.</p>

      {error && (
        <div id="reg-error" role="alert" className="mb-4 p-3 bg-[#ffdad6] text-[#93000a] rounded-lg text-sm flex items-center gap-2">
          <MaterialIcon name="error" fill={1} className="text-base" aria-hidden="true" />
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate aria-describedby={error ? 'reg-error' : undefined}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-first" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
              First Name <span aria-hidden="true">*</span>
            </label>
            <input id="reg-first" type="text" autoComplete="given-name" value={form.firstName}
              onChange={update('firstName')} placeholder="Jane"
              className="w-full px-4 py-3 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] focus:bg-white transition-all placeholder:text-[#bdcaba] text-[#141b2b]" />
          </div>
          <div>
            <label htmlFor="reg-last" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
              Last Name
            </label>
            <input id="reg-last" type="text" autoComplete="family-name" value={form.lastName}
              onChange={update('lastName')} placeholder="Doe"
              className="w-full px-4 py-3 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] focus:bg-white transition-all placeholder:text-[#bdcaba] text-[#141b2b]" />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
            Email Address <span aria-hidden="true">*</span>
          </label>
          <input id="reg-email" type="email" autoComplete="email" value={form.email}
            onChange={update('email')} placeholder="jane.doe@example.com"
            className="w-full px-4 py-3 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] focus:bg-white transition-all placeholder:text-[#bdcaba] text-[#141b2b]" />
        </div>

        <div>
          <label htmlFor="reg-country" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
            Location
          </label>
          <div className="relative">
            <MaterialIcon name="public" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bdcaba] text-xl" />
            <select id="reg-country" value={form.country} onChange={update('country')}
              className="w-full pl-11 pr-4 py-3 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] focus:bg-white transition-all text-[#141b2b] appearance-none cursor-pointer">
              {countries.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-[11px] font-bold text-[#3e4a3d] uppercase tracking-wider mb-1">
            Password <span aria-hidden="true">*</span>
          </label>
          <input id="reg-password" type="password" autoComplete="new-password" value={form.password}
            onChange={update('password')} placeholder="••••••••"
            className="w-full px-4 py-3 bg-[#f1f3ff] rounded-lg border-0 focus:ring-2 focus:ring-[#006b2c] focus:bg-white transition-all placeholder:text-[#bdcaba] text-[#141b2b]" />
          <PasswordStrengthMeter password={form.password} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#006b2c] rounded border-[#bdcaba] focus:ring-[#006b2c] flex-shrink-0" />
          <span className="text-sm text-[#3e4a3d]">
            I agree to the{' '}
            <a href="#" className="text-[#006b2c] font-semibold hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[#006b2c] font-semibold hover:underline">Privacy Policy</a>.
          </span>
        </label>

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? 'Creating account…' : 'Create Free Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#3e4a3d]">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-[#006b2c] font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}

RegisterForm.propTypes = { onSwitch: PropTypes.func.isRequired };
