import { Helmet } from 'react-helmet-async';
import { companyInfo } from '../data/content';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export const SEO = ({ 
  title = '捨得資訊股份有限公司 - 政府採購導向｜資訊系統維護、功能擴充與資安修補服務',
  description = '捨得資訊以「可驗收、可稽核、可持續維運」為核心，提供政府機關與教育體系資訊系統之年度維護（含例行維運、資安修補、功能增修、監控與事件管理），並依採購契約與機關作業規範完成文件交付、測試驗證與上線變更管理。',
  keywords = '資訊系統維護,政府採購,教育體系,系統維運,SLA,資安修補,捨得資訊,DrServ'
}: SEOProps) => {
  const fullTitle = title.includes('捨得資訊') ? title : `${title} | ${companyInfo.name}`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={companyInfo.name} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content="https://www.drserv.com.tw" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": companyInfo.name,
          "alternateName": companyInfo.nameEn,
          "url": "https://www.drserv.com.tw",
          "logo": "https://www.drserv.com.tw/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": companyInfo.phone,
            "contactType": "customer service",
            "email": companyInfo.email,
            "areaServed": "TW",
            "availableLanguage": ["zh-TW"]
          },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": companyInfo.address,
            "addressCountry": "TW"
          },
          "sameAs": []
        })}
      </script>
    </Helmet>
  );
};

