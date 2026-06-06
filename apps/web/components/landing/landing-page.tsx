import { DemoCta, DesksShowcase } from '@/components/landing/desks-showcase';
import { ImprovementLoop, LandingFooter } from '@/components/landing/improvement-loop';
import { LandingHeader, LandingHero } from '@/components/landing/landing-hero';
import { ToolUniverse } from '@/components/landing/tool-universe';

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-black text-white">
      <LandingHeader />
      <main>
        <LandingHero />
        <ToolUniverse />
        <DesksShowcase />
        <ImprovementLoop />
        <DemoCta />
      </main>
      <LandingFooter />
    </div>
  );
}
