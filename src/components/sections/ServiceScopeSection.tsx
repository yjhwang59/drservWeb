import { useState } from 'react';
import { serviceCategories } from '../../data/content';
import { Card } from '../ui/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ServiceScopeSection = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            服務範圍（Scope of Work）
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            提供完整的資訊系統維護、功能擴充與資安修補服務
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {serviceCategories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            return (
              <Card key={category.id} className="overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-gray-900">
                    {category.title}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp size={24} className="text-primary-600" />
                  ) : (
                    <ChevronDown size={24} className="text-gray-400" />
                  )}
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <ul className="space-y-3">
                          {category.items.map((item, index) => (
                            <motion.li
                              key={index}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start space-x-3 text-gray-700"
                            >
                              <span className="text-primary-600 mt-1">•</span>
                              <span>{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

