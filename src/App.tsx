import { HelmetProvider } from 'react-helmet-async';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { SEO } from './components/SEO';
import { HeroSection } from './components/sections/HeroSection';
import { CoreCapabilitiesSection } from './components/sections/CoreCapabilitiesSection';
import { ProjectExperienceSection } from './components/sections/ProjectExperienceSection';
import { ServiceScopeSection } from './components/sections/ServiceScopeSection';
import { SLASection } from './components/sections/SLASection';
import { DeliverablesSection } from './components/sections/DeliverablesSection';
import { ProcessFlowSection } from './components/sections/ProcessFlowSection';
import { ContactSection } from './components/sections/ContactSection';

function App() {
  return (
    <HelmetProvider>
      <SEO />
      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSection />
          <CoreCapabilitiesSection />
          <ProjectExperienceSection />
          <ServiceScopeSection />
          <SLASection />
          <DeliverablesSection />
          <ProcessFlowSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

export default App;

