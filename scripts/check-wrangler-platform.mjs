#!/usr/bin/env node
/**
 * 在執行 wrangler 前檢查本機是否支援。
 * Cloudflare workerd 不支援 Windows ARM64，會拋出 Unsupported platform: win32 arm64 LE。
 * 此腳本先偵測並顯示友善訊息，避免一長串 stack trace。
 */
const isWinArm64 = process.platform === 'win32' && process.arch === 'arm64';

if (isWinArm64) {
  console.error('');
  console.error('  \u26A0  wrangler / workerd 不支援 Windows ARM64，無法在本機執行 Worker 開發伺服器。');
  console.error('');
  console.error('  可行做法：');
  console.error('    \u2022 僅開發前端：執行 npm run dev，用 http://localhost:3000 預覽（API 會連不到後端）。');
  console.error('    \u2022 完整前後端：在 x64 電腦、WSL2 或 GitHub Actions 上執行 npm run dev:cf 或 npm run dev:all。');
  console.error('    \u2022 部署與 D1：用 npm run deploy 與 GitHub Actions 部署，本機不需跑 wrangler。');
  console.error('');
  process.exit(1);
}

process.exit(0);
