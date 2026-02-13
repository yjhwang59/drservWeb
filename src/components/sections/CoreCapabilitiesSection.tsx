import { coreCapabilities } from '../../data/content';
import { Card } from '../ui/Card';
import { Server, Code, Shield, FileCheck } from 'lucide-react';

const iconMap: Record<string, typeof Server> = {
  Server,
  Code,
  Shield,
  FileCheck,
};

export const CoreCapabilitiesSection = () => {
  return (
    <section id="capabilities" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            我們的核心能力
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            專注於政府與教育體系的資訊系統建置、維運與功能擴充，協助機關與學校建立穩定、安全、可長期演進的平台
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreCapabilities.map((capability) => {
            const Icon = iconMap[capability.icon] || Server;
            return (
              <Card key={capability.id} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary-100 rounded-full">
                    <Icon size={32} className="text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {capability.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {capability.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

