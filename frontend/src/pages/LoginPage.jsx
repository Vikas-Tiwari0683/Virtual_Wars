// =============================================================================
// SECTION: LoginPage
// Split-screen auth page with Sign In and Create Account tabs.
// Left panel: brand + stats. Right panel: tabbed form (login / register).
// Form components live in components/auth/LoginForms.jsx.
// =============================================================================

import { useState } from 'react';
import MaterialIcon from '../components/atoms/MaterialIcon';
import { LoginForm, RegisterForm } from '../components/auth/LoginForms';

// =============================================================================
// SECTION: LeftPanel — Brand & Stats Column (md+ only)
// =============================================================================
function LeftPanel() {
  return (
    <div className="hidden md:flex relative w-1/2 bg-[#00873a] overflow-hidden flex-col justify-between p-16">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-10">
          <MaterialIcon name="eco" fill={1} className="text-[#f7fff2] text-4xl" />
          <h1 className="text-2xl font-bold text-[#f7fff2]">CarbonTrace</h1>
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl font-bold text-[#f7fff2] leading-tight">
            Every gram of carbon tells a story.
          </h2>
          <p className="text-base text-white/80 mt-6 leading-relaxed">
            Join 50,000+ individuals using data to drive climate action and sustainable change.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          <p className="text-[11px] text-white/60 uppercase font-bold mb-1">Total CO₂ Reduced</p>
          <p className="font-mono text-4xl font-bold text-[#f7fff2]">
            12.4<span className="text-xl">M tons</span>
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          <p className="text-[11px] text-white/60 uppercase font-bold mb-1">Active Communities</p>
          <p className="font-mono text-4xl font-bold text-[#f7fff2]">842</p>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#006b2c]/40 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#006b2c]/30 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />
    </div>
  );
}

// =============================================================================
// SECTION: LoginPage — Default Export
// =============================================================================
export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <LeftPanel />

      <div className="w-full md:w-1/2 bg-[#f9f9ff] flex items-center justify-center p-6 md:p-16" id="main-content" tabIndex={-1}>
        <div className="w-full max-w-md">
          <div className="flex md:hidden items-center gap-2 mb-10 justify-center">
            <MaterialIcon name="eco" fill={1} className="text-[#006b2c] text-3xl" />
            <span className="text-2xl font-bold text-[#006b2c]">CarbonTrace</span>
          </div>

          <div className="flex p-1 bg-[#e9edff] rounded-xl mb-8" role="tablist" aria-label="Authentication options">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#006b2c] shadow-sm'
                    : 'text-[#3e4a3d] hover:bg-[#e1e8fd]'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {activeTab === 'login' ? (
            <LoginForm onSwitch={() => setActiveTab('register')} />
          ) : (
            <RegisterForm onSwitch={() => setActiveTab('login')} />
          )}

          <p className="mt-8 text-center text-xs text-[#3e4a3d]">
            © 2026 CarbonTrace. Empowering sustainable living through data.
          </p>
        </div>
      </div>
    </div>
  );
}
