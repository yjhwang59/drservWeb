import { slaLevels, kpiMetrics } from '../../data/content';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, AlertCircle } from 'lucide-react';

const levelColors: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  P1: 'warning',
  P2: 'info',
  P3: 'success',
  P4: 'primary',
};

export const SLASection = () => {
  return (
    <section id="sla" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            SLA 與事件分級
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            我們可提供標準化SLA模板，常見分級如下（可於契約/需求書明確化）
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {slaLevels.map((sla) => (
            <Card key={sla.level} className="relative">
              <div className="flex items-center justify-between mb-4">
                <Badge variant={levelColors[sla.level]}>
                  {sla.level}
                </Badge>
                <AlertCircle size={20} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {sla.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {sla.description}
              </p>
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock size={16} className="text-primary-600" />
                  <span className="text-gray-700">
                    <strong>回應：</strong>{sla.response}
                  </span>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {sla.resolution}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            月報 KPI 指標
          </h3>
          <p className="text-gray-700 mb-4">
            可提供「月報KPI」包含以下指標：
          </p>
          <div className="flex flex-wrap gap-2">
            {kpiMetrics.map((metric, index) => (
              <Badge key={index} variant="info">
                {metric}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};

