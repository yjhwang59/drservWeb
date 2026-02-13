import { companyInfo } from '../../data/content';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4">{companyInfo.name}</h3>
            <p className="text-sm mb-4">{companyInfo.nameEn}</p>
            <p className="text-sm">統一編號：{companyInfo.taxId}</p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">聯絡資訊</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm">{companyInfo.address}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={20} className="flex-shrink-0" />
                <a href={`tel:${companyInfo.phone}`} className="text-sm hover:text-white transition-colors">
                  {companyInfo.phone}
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="flex-shrink-0" />
                <a href={`mailto:${companyInfo.email}`} className="text-sm hover:text-white transition-colors">
                  {companyInfo.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">服務項目</h4>
            <ul className="space-y-2 text-sm">
              <li>• 系統維運與SLA管理</li>
              <li>• 功能擴充與需求迭代</li>
              <li>• 平台穩定性與資安治理</li>
              <li>• 政府機關專案交付</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} {companyInfo.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

