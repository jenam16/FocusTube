import React from 'react';
import {
  LandingNavbar,
  HeroSection,
  ProductPreview,
  ProblemSolutionSection,
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

        {/* 4. YouTube Problem vs. FocusTube Solution */}
        <ProblemSolutionSection />

        {/* 5. How It Works (Connected Learning Journey Stepper) */}
        <HowItWorksSection />

        {/* 6. Core Features (Controlled Bento Grid) */}
        <CoreFeaturesSection />

        {/* 7. Focus Mode Experience (Clean Split Layout) */}
        <FocusModeSection />

        {/* 8. Notes + Captured Moments */}
        <NotesCaptureSection />

        {/* 9. Progress & Learning Habit Tracking (Minimal Metric Grid) */}
        <ProgressHabitSection />

        {/* 10. Final High-Impact CTA */}
        <FinalCTASection />
      </main>

      {/* 11. Minimal Clean Footer */}
      <LandingFooter />
    </div>
  );
};
