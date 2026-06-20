// =============================================================================
// SECTION: Landing page — top sections
// HeroSection, SocialProofBar, HowItWorksSection.
// Extracted from LandingPage.jsx to keep each module focused and small.
// =============================================================================

import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import MaterialIcon from '../atoms/MaterialIcon';
import { ROUTES } from '../../utils/constants';

// =============================================================================
// HeroSection — above-the-fold headline, CTAs, and floating mock cards.
// =============================================================================
export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="pt-24 pb-20 bg-[#f0fdf4] min-h-[90vh] flex items-center"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#b1f2be] text-[#347047] px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
            <MaterialIcon name="verified" fill={1} className="text-sm" />
            Science-Based Tracking
          </div>

          <h1
            id="hero-heading"
            className="text-5xl md:text-[56px] font-bold text-[#141b2b] leading-tight tracking-tight"
          >
            See your carbon footprint.{' '}
            <span className="text-[#006b2c]">Shrink it</span> one habit at a time.
          </h1>

          <p className="text-base text-[#3e4a3d] max-w-xl leading-relaxed">
            The data-driven platform that turns climate anxiety into climate action.
            Track emissions, discover personalised reductions, and join a community
            committed to a net-zero future.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button onClick={() => navigate(ROUTES.LOGIN)}>
              Start Your Profile
            </Button>
            <Button variant="secondary">
              <MaterialIcon name="play_circle" className="text-lg" />
              Watch Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 opacity-70 text-sm text-[#3e4a3d]">
            <span className="flex items-center gap-1">
              <MaterialIcon name="shield" fill={1} className="text-[#006b2c] text-base" />
              No credit card
            </span>
            <span className="flex items-center gap-1">
              <MaterialIcon name="check_circle" fill={1} className="text-[#006b2c] text-base" />
              Free forever plan
            </span>
            <span className="flex items-center gap-1">
              <MaterialIcon name="star" fill={1} className="text-[#8d4b00] text-base" />
              4.9 / 5 from 2,400 reviews
            </span>
          </div>
        </div>

        <div className="relative hidden md:flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full bg-[#006b2c]/10 blur-3xl" />
          </div>

          <div className="animate-float relative z-10 bg-white p-4 rounded-3xl shadow-2xl border border-[#bdcaba] max-w-xs w-full">
            <div className="bg-[#f0fdf4] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#3e4a3d] uppercase tracking-widest">Today's Score</span>
                <span className="text-[10px] bg-[#ffdcc3] text-[#8d4b00] px-2 py-0.5 rounded-full font-bold">Moderate</span>
              </div>
              <p className="font-mono text-4xl font-bold text-[#006b2c]">8.4</p>
              <p className="text-xs text-[#3e4a3d]">kg CO₂e today</p>
              <svg viewBox="0 0 200 60" className="w-full h-10" aria-hidden="true">
                <defs>
                  <linearGradient id="heroGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#006b2c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#006b2c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,45 Q40,30 80,38 T160,22 T200,15" fill="none" stroke="#006b2c" strokeWidth="2.5" />
                <path d="M0,45 Q40,30 80,38 T160,22 T200,15 V60 H0 Z" fill="url(#heroGrad)" />
              </svg>
            </div>
          </div>

          <div
            className="animate-float-delayed absolute -left-8 top-12 z-20 bg-white p-3 rounded-xl shadow-xl border border-[#bdcaba]"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#b1f2be] rounded-full flex items-center justify-center">
                <MaterialIcon name="trending_down" className="text-[#006b2c] text-lg" />
              </div>
              <div>
                <p className="text-[10px] text-[#3e4a3d] uppercase font-bold">Monthly</p>
                <p className="font-mono text-[#006b2c] font-bold text-sm">-12.4% CO₂e</p>
              </div>
            </div>
          </div>

          <div
            className="animate-float absolute -right-4 bottom-16 z-20 bg-white p-3 rounded-xl shadow-xl border border-[#bdcaba]"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#ffdcc3] rounded-full flex items-center justify-center">
                <MaterialIcon name="eco" fill={1} className="text-[#8d4b00] text-lg" />
              </div>
              <div>
                <p className="text-[10px] text-[#3e4a3d] uppercase font-bold">Trees Saved</p>
                <p className="font-mono text-[#8d4b00] font-bold text-sm">14 Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// SocialProofBar — greyscale company logos strip.
// =============================================================================
export function SocialProofBar() {
  const companies = ['ECO-CORP', 'GREEN-LOGIC', 'NATURE-PATH', 'SUSTAIN-X', 'VITAL-EARTH'];
  return (
    <section className="py-8 bg-white border-b border-[#bdcaba]" aria-label="Trusted by">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-bold text-[#3e4a3d] uppercase tracking-widest mb-6">
          Empowering Sustainability Teams At
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 opacity-40 grayscale">
          {companies.map((name) => (
            <span key={name} className="text-2xl font-extrabold tracking-tighter text-[#141b2b]">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// HowItWorksSection — 3-step explainer.
// =============================================================================
export function HowItWorksSection() {
  const steps = [
    { number: '01', icon: 'edit_note', title: 'Log Activity', description: 'Connect your accounts or quickly log habits like travel, diet, and home energy in seconds.' },
    { number: '02', icon: 'query_stats', title: 'See Impact', description: 'View real-time carbon scores and understand exactly where your emissions come from with scientific precision.' },
    { number: '03', icon: 'bolt', title: 'Take Action', description: 'Follow personalised AI recommendations to reduce your score and unlock exclusive sustainable rewards.' },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#f9f9ff]" aria-labelledby="hiw-heading">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 id="hiw-heading" className="text-4xl font-bold text-[#141b2b] mb-16">
          Shrinking your footprint is simple
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="group">
              <div className="relative mb-6">
                <div className="text-[120px] font-extrabold text-[#bdcaba]/30 absolute -top-16 left-1/2 -translate-x-1/2 select-none leading-none">
                  {step.number}
                </div>
                <div className="w-20 h-20 bg-[#006b2c] text-white rounded-2xl flex items-center justify-center mx-auto relative z-10 shadow-lg group-hover:scale-110 transition-transform">
                  <MaterialIcon name={step.icon} className="text-4xl" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[#141b2b] mb-2">{step.title}</h3>
              <p className="text-sm text-[#3e4a3d]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
