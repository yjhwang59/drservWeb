import { processSteps } from '../../data/content';
import { Card } from '../ui/Card';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProcessFlowSection = () => {
  return (
    <section id="process" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            合作流程
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            從需求盤點到持續優化，我們提供完整的專案管理與交付流程
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop View - Horizontal Flow */}
          <div className="hidden lg:block">
            <div className="flex items-start justify-between">
              {processSteps.map((step, index) => (
                <div key={step.id} className="flex items-start flex-1">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col items-center flex-1"
                  >
                    <div className="relative w-full">
                      <Card className="text-center mb-4">
                        <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                          {step.step}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {step.description}
                        </p>
                      </Card>
                      {index < processSteps.length - 1 && (
                        <div className="absolute top-8 left-full w-full flex items-center justify-center -ml-8">
                          <ArrowRight size={24} className="text-primary-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile/Tablet View - Vertical Flow */}
          <div className="lg:hidden space-y-6">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="w-0.5 h-full bg-primary-200 mt-2 min-h-[60px]" />
                  )}
                </div>
                <Card className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

