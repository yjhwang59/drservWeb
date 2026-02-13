import { deliverables } from '../../data/content';
import { Card } from '../ui/Card';
import { FileText, FileSearch, CheckSquare, Upload, ShieldAlert, BookOpen, BarChart } from 'lucide-react';

const iconMap: Record<string, typeof FileText> = {
  FileText,
  FileSearch,
  CheckSquare,
  Upload,
  ShieldAlert,
  BookOpen,
  BarChart,
};

export const DeliverablesSection = () => {
  return (
    <section id="deliverables" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            標準交付物（Deliverables）
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            為符合政府採購驗收與稽核需求，我們提供文件化交付
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((deliverable) => {
            const Icon = iconMap[deliverable.icon] || FileText;
            return (
              <Card key={deliverable.id} className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 rounded-lg flex-shrink-0">
                  <Icon size={24} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {deliverable.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {deliverable.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

