// =============================================================================
// SECTION: LandingPage
// Public marketing page. Composes the section components defined in
// components/landing/. Section order:
//   Navbar → Hero → Social Proof → How It Works → Features Grid
//   → Visualization → Testimonials → CTA Banner → Footer
// =============================================================================

import Navbar from '../components/layout/Navbar';
import { HeroSection, SocialProofBar, HowItWorksSection } from '../components/landing/LandingTop';
import {
  FeaturesGrid,
  VisualizationSection,
  TestimonialsSection,
  CTABanner,
  Footer,
} from '../components/landing/LandingBottom';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <SocialProofBar />
        <HowItWorksSection />
        <FeaturesGrid />
        <VisualizationSection />
        <TestimonialsSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
