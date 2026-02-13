# 快速啟動指南

## 第一步：安裝依賴

```bash
npm install
```

## 第二步：啟動開發伺服器

```bash
npm run dev
```

瀏覽器會自動開啟 `http://localhost:5173`

## 第三步：開始開發

- 修改 `src/data/content.ts` 更新網站內容
- 修改 `src/components/sections/` 中的組件調整頁面區塊
- 修改 `src/index.css` 或 Tailwind 配置調整樣式

## 常用指令

```bash
# 開發模式
npm run dev

# 構建生產版本
npm run build

# 預覽生產版本
npm run preview

# 檢查代碼品質
npm run lint
```

## 專案結構說明

```
src/
├── components/        # React 組件
│   ├── layout/       # 佈局組件（Header, Footer）
│   ├── sections/     # 頁面區塊組件
│   ├── ui/          # 可重用UI組件
│   └── SEO.tsx      # SEO 優化組件
├── data/            # 內容資料
│   └── content.ts   # 所有網站內容
├── types/           # TypeScript 類型定義
└── App.tsx          # 主應用組件
```

## 自訂內容

### 修改公司資訊

編輯 `src/data/content.ts` 中的 `companyInfo` 物件：

```typescript
export const companyInfo: CompanyInfo = {
  name: '您的公司名稱',
  // ... 其他資訊
};
```

### 修改網站區塊

每個區塊都是獨立的組件，位於 `src/components/sections/`：

- `HeroSection.tsx` - 首頁主視覺
- `CoreCapabilitiesSection.tsx` - 核心能力
- `ProjectExperienceSection.tsx` - 專案經驗
- `ServiceScopeSection.tsx` - 服務範圍
- `SLASection.tsx` - SLA 保障
- `DeliverablesSection.tsx` - 標準交付物
- `ProcessFlowSection.tsx` - 合作流程
- `ContactSection.tsx` - 聯絡表單

### 修改顏色主題

編輯 `tailwind.config.js`：

```javascript
colors: {
  primary: {
    // 修改主色調
  },
  accent: {
    // 修改強調色
  },
}
```

## 下一步

- 查看 [README.md](README.md) 了解完整功能
- 查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解部署方式
- 整合後端 API 或 EmailJS 處理表單提交

