import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { responseJson } from '../../lib/safeJson';
import { companyInfo, inquiryTypes as fallbackInquiryTypes, contactDescription, supportDescription } from '../../data/content';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const contactFormSchema = z.object({
  organization: z.string().min(1, '請輸入機關名稱'),
  contactName: z.string().min(1, '請輸入聯絡人姓名'),
  phone: z.string().min(1, '請輸入聯絡電話'),
  email: z.string().email('請輸入有效的電子郵件'),
  inquiryType: z.string().min(1, '請選擇洽詢內容'),
  message: z.string().min(10, '請輸入至少10個字的訊息內容'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export const ContactSection = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryTypeOptions, setInquiryTypeOptions] = useState<string[]>(fallbackInquiryTypes);

  useEffect(() => {
    fetch('/api/inquiry-types')
      .then((res) => responseJson<{ success?: boolean; items?: { label: string }[] }>(res))
      .then((data) => {
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          setInquiryTypeOptions(data.items.map((item) => item.label));
        }
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await responseJson<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(result.message || '送出失敗，請稍後再試');
      }

      setIsSubmitted(true);
      reset();
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '送出失敗，請稍後再試';
      window.alert(message);
    }
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            聯絡我們
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto whitespace-pre-line">
            {contactDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Company Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                公司資訊
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-4">
                  <MapPin size={24} className="text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">地址</p>
                    <p className="text-gray-600">{companyInfo.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Phone size={24} className="text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">電話</p>
                    <a href={`tel:${companyInfo.phone}`} className="text-primary-600 hover:text-primary-700">
                      {companyInfo.phone}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Mail size={24} className="text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <a href={`mailto:${companyInfo.email}`} className="text-primary-600 hover:text-primary-700">
                      {companyInfo.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4 font-semibold">統一編號：{companyInfo.taxId}</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {supportDescription}
                </p>
              </div>

              {/* Google Maps Embed */}
              <div className="mt-6 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3615.5!2d121.529!3d25.017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDAwJzUxLjIiTiAxMjHCsDMxJzQ0LjQiRQ!5e0!3m2!1szh-TW!2stw!4v1234567890"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="公司位置"
                />
              </div>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                立即洽詢
              </h3>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    訊息已送出！
                  </p>
                  <p className="text-gray-600">
                    我們會盡快與您聯繫
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                      機關名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('organization')}
                      type="text"
                      id="organization"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="請輸入機關名稱"
                    />
                    {errors.organization && (
                      <p className="mt-1 text-sm text-red-600">{errors.organization.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                      聯絡人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('contactName')}
                      type="text"
                      id="contactName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="請輸入聯絡人姓名"
                    />
                    {errors.contactName && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        聯絡電話 <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        id="phone"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="(02) 1234-5678"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        id="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="example@domain.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-1">
                      洽詢內容 <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('inquiryType')}
                      id="inquiryType"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">請選擇洽詢內容</option>
                      {inquiryTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.inquiryType && (
                      <p className="mt-1 text-sm text-red-600">{errors.inquiryType.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      訊息內容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('message')}
                      id="message"
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="請詳細說明您的需求..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      '送出中...'
                    ) : (
                      <>
                        <Send size={20} className="inline-block mr-2" />
                        送出訊息
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

