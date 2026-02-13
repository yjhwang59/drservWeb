import { 
  CoreCapability, 
  ProjectExperience, 
  ServiceCategory, 
  SLALevel, 
  Deliverable, 
  ProcessStep, 
  CompanyInfo 
} from '../types';

export const companyInfo: CompanyInfo = {
  name: '捨得資訊股份有限公司',
  nameEn: 'DrServ Information Inc.',
  taxId: '16921489',
  address: '臺北市大安區羅斯福路三段77號6樓',
  phone: '(02) 2363-0826',
  email: 'service@drserv.com.tw',
};

export const heroContent = {
  title: '捨得資訊股份有限公司',
  subtitle: '政府採購導向｜資訊系統維護、功能擴充與資安修補服務',
  coreValue: '可驗收、可稽核、可持續維運',
  description: '捨得資訊以「可驗收、可稽核、可持續維運」為核心，提供政府機關與教育體系資訊系統之年度維護（含例行維運、資安修補、功能增修、監控與事件管理），並依採購契約與機關作業規範完成文件交付、測試驗證與上線變更管理。',
};

export const coreCapabilities: CoreCapability[] = [
  {
    id: '1',
    title: '系統維運與SLA管理',
    description: '例行維運、故障排除、版本更新、可用性與效能監控',
    icon: 'Server',
  },
  {
    id: '2',
    title: '功能擴充與需求迭代',
    description: '依政策與業務變更進行增修與整合',
    icon: 'Code',
  },
  {
    id: '3',
    title: '平台穩定性與資安治理',
    description: '權限控管、稽核紀錄、弱點修補、資安事件應變協作',
    icon: 'Shield',
  },
  {
    id: '4',
    title: '政府機關專案交付能力',
    description: '文件化交付、測試驗證、上線切換與教育訓練支援',
    icon: 'FileCheck',
  },
];

export const projectExperiences: ProjectExperience[] = [
  {
    id: '1',
    title: '全國高級中等以下學校教師選聘網（選聘網）',
    description: '系統廠商資訊於網站頁面公開揭露：捨得資訊股份有限公司',
    details: [
      '服務窗口：service@drserv.com.tw',
      '服務時間：週一至週五 08:00–12:00、13:30–17:30',
      '聯絡電話：(02) 2363-0826',
    ],
    highlight: '系統公開揭露',
  },
  {
    id: '2',
    title: '教育部國民及學前教育署 人事室 / 人事服務網',
    description: '具備教育體系人事服務相關系統之年度維護與服務經驗',
    details: [
      '既有系統維運',
      '修補與功能調整',
      '年度維護服務',
    ],
  },
  {
    id: '3',
    title: '教育部相關網站/平台專案',
    description: '具備教育部層級之網站更新、報名/認證類系統更新、擴充與維護之專案經驗',
    details: [
      '網站更新與維護',
      '報名/認證類系統擴充',
      '依公開決標/彙整資訊可查',
    ],
  },
];

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'A',
    title: 'A. 維運與例行作業',
    items: [
      '系統監控與告警（可用性、效能、容量、錯誤率）',
      '例行更新（套件/框架/OS更新與相容性評估）',
      '備份與復原演練（含演練紀錄與改善建議）',
      '帳號/權限協作（最小權限、異動紀錄、存取審核）',
    ],
  },
  {
    id: 'B',
    title: 'B. 變更與版本管理',
    items: [
      '需求單/變更單（CR）管理與影響分析',
      '版本控管（Git/Tag/Release Note）',
      '測試規劃（單元/整合/回歸/資安修補複測）',
      '上線切換（含回復方案與停機窗口規劃）',
    ],
  },
  {
    id: 'C',
    title: 'C. 資安修補與弱點管理',
    items: [
      'CVE/弱掃/滲測發現事項之修補與複測',
      '重大弱點快速修補流程（含臨時緩解措施）',
      '稽核紀錄保留（Log/Audit Trail）與查核支援',
      '安全設定基線（Baseline）與設定檢核報告',
    ],
  },
];

export const slaLevels: SLALevel[] = [
  {
    level: 'P1',
    name: '重大',
    description: '系統不可用/核心功能中斷',
    response: '1小時內',
    resolution: '暫時復原：4小時內（或依契約）\n根因分析（RCA）：3個工作天內',
  },
  {
    level: 'P2',
    name: '高',
    description: '關鍵功能異常/有替代方案',
    response: '4小時內',
    resolution: '修復：1–3個工作天（或依契約）',
  },
  {
    level: 'P3',
    name: '一般',
    description: '非關鍵問題/介面或報表瑕疵',
    response: '1個工作天內',
    resolution: '修復：排入版本或定期更新',
  },
  {
    level: 'P4',
    name: '諮詢/優化建議',
    description: '依排程提供建議與工時估算',
    response: '依排程',
    resolution: '提供建議與工時估算',
  },
];

export const kpiMetrics = [
  '可用率',
  '事件數',
  '平均回應/修復時間',
  '變更成功率',
  '弱點修補完成率',
];

export const deliverables: Deliverable[] = [
  {
    id: '1',
    title: '維護計畫書 / 服務計畫書',
    description: '含SLA、作業流程、溝通機制',
    icon: 'FileText',
  },
  {
    id: '2',
    title: '需求規格 / 變更影響分析',
    description: '含工期、風險、回復方案',
    icon: 'FileSearch',
  },
  {
    id: '3',
    title: '測試計畫與測試報告',
    description: '含回歸測試與修補複測',
    icon: 'CheckSquare',
  },
  {
    id: '4',
    title: '上線報告 / 版本釋出說明',
    description: 'Release Notes',
    icon: 'Upload',
  },
  {
    id: '5',
    title: '資安修補紀錄與弱點處置報告',
    description: '含證據截圖/掃描結果對照',
    icon: 'ShieldAlert',
  },
  {
    id: '6',
    title: '操作手冊 / 管理者手冊',
    description: '教育訓練教材（如需求）',
    icon: 'BookOpen',
  },
  {
    id: '7',
    title: '維運月報 / 季報',
    description: '含KPI、事件回顧、改善項目',
    icon: 'BarChart',
  },
];

export const processSteps: ProcessStep[] = [
  {
    id: '1',
    title: '需求盤點',
    description: '現況、痛點、維運風險與優先序',
    step: 1,
  },
  {
    id: '2',
    title: '技術評估',
    description: '架構、資安、效能、資料與介接點',
    step: 2,
  },
  {
    id: '3',
    title: '交付規劃',
    description: '維運SLA、里程碑、驗收與文件',
    step: 3,
  },
  {
    id: '4',
    title: '上線運作',
    description: '監控、事件管理、版本更新與例行報告',
    step: 4,
  },
  {
    id: '5',
    title: '持續優化',
    description: '依業務與政策調整，迭代功能與體驗',
    step: 5,
  },
];

export const inquiryTypes = [
  '系統維運評估',
  '既有平台健檢',
  '年度維護規劃',
  '功能擴充規劃',
  '其他',
];

export const contactDescription = '如需「系統維運評估」、「既有平台健檢」、「年度維護與功能擴充規劃」，請來信或來電洽談，我們可提供初步盤點與建議方案。';

export const supportDescription = '如貴機關已具備需求書（RFP）或預計公告採購案，我們可協助：\n• 盤點既有系統現況與維運風險\n• 提供SLA建議值、交付物清單與驗收條款建議\n• 提供維護工時與功能擴充估算框架（含風險與假設條件）';

