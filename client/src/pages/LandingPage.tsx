import React from 'react';
import {
  LandingNavbar,
  HeroSection,
  ProductPreview,
  HowItWorksSection,
  CoreFeaturesSection,
  FocusModeSection,
  NotesCaptureSection,
  ProgressHabitSection,
  FinalCTASection,
  LandingFooter,
} from '../components/landing';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* 1. Sticky Minimal Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Realistic Product Workspace Preview */}
        <ProductPreview />

        {/* 4. How It Works (4 Clean Steps) */}
        <HowItWorksSection />

        {/* 5. Core Features (Focused 2x3 Grid) */}
        <CoreFeaturesSection />

        {/* 6. Focus Mode Experience */}
        <FocusModeSection />

        {/* 7. Notes + Captured Moments */}
        <NotesCaptureSection />

        {/* 8. Progress & Learning Habit Tracking */}
        <ProgressHabitSection />

        {/* 9. Final High-Impact CTA */}
        <FinalCTASection />
      </main>

      {/* 10. Minimal Clean Footer */}
      <LandingFooter />
    </div>
  );
};
