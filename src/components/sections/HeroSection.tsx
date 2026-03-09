import { Link } from 'react-scroll';
import { ArrowDown, Download } from 'lucide-react';
import { heroContent } from '../../data/content';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* 留出固定導覽列高度(5rem)，內容在可視區域內置中，避免標題被裁切 */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-[calc(100vh-5rem)] pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {heroContent.title}
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl mb-4 text-primary-100">
              {heroContent.subtitle}
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8">
              <span className="text-lg font-semibold">{heroContent.coreValue}</span>
            </div>
            <p className="text-lg sm:text-xl mb-10 text-primary-100 max-w-3xl mx-auto leading-relaxed">
              {heroContent.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="contact" spy={true} smooth={true} offset={-80} duration={500}>
              <Button size="lg" className="w-full sm:w-auto">
                立即洽詢
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Download className="inline-block mr-2" size={20} />
              下載服務簡介
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-16"
          >
            <Link to="capabilities" spy={true} smooth={true} offset={-80} duration={500}>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex flex-col items-center cursor-pointer text-primary-100 hover:text-white transition-colors"
              >
                <span className="text-sm mb-2">了解更多</span>
                <ArrowDown size={24} />
              </motion.div>
            </Link>
          </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
};

