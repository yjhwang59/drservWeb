import { Routes, Route } from 'react-router-dom';
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
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InquiryTypesPage } from './components/admin/InquiryTypesPage';
import { InquiriesListPage } from './components/admin/InquiriesListPage';
import { InquiryDetailPage } from './components/admin/InquiryDetailPage';

function PublicSite() {
  return (
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
  );
}

function App() {
  return (
    <HelmetProvider>
      <SEO />
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="inquiry-types" element={<InquiryTypesPage />} />
          <Route path="inquiries" element={<InquiriesListPage />} />
          <Route path="inquiries/:id" element={<InquiryDetailPage />} />
        </Route>
      </Routes>
    </HelmetProvider>
  );
}

export default App;
