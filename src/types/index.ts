export interface CoreCapability {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ProjectExperience {
  id: string;
  title: string;
  description: string;
  details: string[];
  highlight?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  items: string[];
}

export interface SLALevel {
  level: string;
  name: string;
  description: string;
  response: string;
  resolution: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  step: number;
}

export interface CompanyInfo {
  name: string;
  nameEn: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
}

export interface ContactFormData {
  organization: string;
  contactName: string;
  phone: string;
  email: string;
  inquiryType: string;
  message: string;
}

