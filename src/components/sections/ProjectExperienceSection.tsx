import { projectExperiences } from '../../data/content';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle2 } from 'lucide-react';

export const ProjectExperienceSection = () => {
  return (
    <section id="projects" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            教育部 / 國教署相關系統服務經驗
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            以下為依公開資訊彙整之專案摘要；若貴機關需要正式佐證文件，可於洽談時提供彙整包供查驗
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {projectExperiences.map((project, index) => (
            <Card key={project.id} className="relative">
              {project.highlight && (
                <div className="absolute top-4 right-4">
                  <Badge variant="success">{project.highlight}</Badge>
                </div>
              )}
              <div className="mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary-600 font-bold text-xl">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {project.description}
                </p>
              </div>
              <ul className="space-y-2">
                {project.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                    <CheckCircle2 size={18} className="text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700 text-center">
            <strong>註：</strong>以上為依公開資訊彙整之專案摘要；若貴機關需要正式佐證文件（決標公告、系統頁面公告截圖、公司登記資料等），可於洽談時提供彙整包供查驗。
          </p>
        </div>
      </div>
    </section>
  );
};

