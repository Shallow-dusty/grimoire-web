#!/usr/bin/env node

/**
 * 部署前检查清单 - 血染钟楼魔典 v0.9.0
 *
 * 这个脚本验证所有部署必需的配置和文件
 * 使用: node scripts/pre-deployment-check.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 部署前检查清单\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let allChecksPass = true;

const exists = (...segments) => fs.existsSync(path.join(projectRoot, ...segments));
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'public/manifest.json'), 'utf-8'));
const manifestAssetExists = (assetPath) => exists('public', assetPath.replace(/^\//, ''));

const getManifestAssetPaths = () => {
  const paths = [];
  for (const icon of manifest.icons ?? []) {
    paths.push(icon.src);
  }
  for (const screenshot of manifest.screenshots ?? []) {
    paths.push(screenshot.src);
  }
  for (const shortcut of manifest.shortcuts ?? []) {
    for (const icon of shortcut.icons ?? []) {
      paths.push(icon.src);
    }
  }
  return [...new Set(paths)];
};

// ============================================================================
// 检查项
// ============================================================================

const checks = [
  {
    category: '📋 环境配置',
    items: [
      {
        name: 'VAPID 公钥',
        check: () => {
          const envPath = path.join(projectRoot, '.env.local');
          if (!fs.existsSync(envPath)) return false;
          const content = fs.readFileSync(envPath, 'utf-8');
          return content.includes('VITE_VAPID_PUBLIC_KEY=');
        }
      },
      {
        name: 'VAPID 私钥',
        check: () => {
          const envPath = path.join(projectRoot, '.env.local');
          if (!fs.existsSync(envPath)) return Boolean(process.env.VAPID_PRIVATE_KEY);
          const content = fs.readFileSync(envPath, 'utf-8');
          const hasLocalKey = /(^|\\n)\\s*VAPID_PRIVATE_KEY=\\S+/.test(content);
          const hasServerManagedHint = content.includes('VAPID_PRIVATE_KEY') && content.includes('服务端');
          return hasLocalKey || Boolean(process.env.VAPID_PRIVATE_KEY) || hasServerManagedHint;
        }
      },
      {
        name: 'Supabase 连接',
        check: () => {
          const envPath = path.join(projectRoot, '.env.local');
          if (!fs.existsSync(envPath)) return false;
          const content = fs.readFileSync(envPath, 'utf-8');
          return content.includes('VITE_SUPABASE_URL=');
        }
      }
    ]
  },
  {
    category: '🖼️  PWA 资源',
    items: [
      { name: 'icon-192.png', check: () => exists('public/img/icon-192.png') },
      { name: 'icon-512.png', check: () => exists('public/img/icon-512.png') },
      { name: 'icon-144.png', check: () => exists('public/img/icon-144.png') },
      { name: 'badge-72.png', check: () => exists('public/img/badge-72.png') },
      { name: 'icon-192-maskable.png', check: () => exists('public/img/icon-192-maskable.png') },
      { name: 'apple-touch-icon.png', check: () => exists('public/img/apple-touch-icon.png') },
      { name: 'manifest 引用资源', check: () => getManifestAssetPaths().every(manifestAssetExists) },
      { name: 'lobby-bg-v2.webp', check: () => exists('public/img/lobby-bg-v2.webp') },
      { name: 'grimoire-bg-v2.webp', check: () => exists('public/img/grimoire-bg-v2.webp') },
    ]
  },
  {
    category: '⚙️  配置文件',
    items: [
      { name: '.env.example', check: () => exists('.env.example') },
      { name: 'manifest.json', check: () => exists('public/manifest.json') },
      { name: 'service-worker.js', check: () => exists('public/service-worker.js') },
      { name: 'index.html', check: () => exists('index.html') },
      { name: 'vite.config.ts', check: () => exists('vite.config.ts') },
    ]
  },
  {
    category: '📦 构建产物',
    items: [
      { name: 'dist/ 目录', check: () => fs.existsSync(path.join(projectRoot, 'dist')) },
      { name: 'dist/index.html', check: () => fs.existsSync(path.join(projectRoot, 'dist/index.html')) },
      { name: 'dist/assets/', check: () => fs.existsSync(path.join(projectRoot, 'dist/assets')) },
      { name: 'dist/img/', check: () => fs.existsSync(path.join(projectRoot, 'dist/img')) },
    ]
  },
  {
    category: '📚 部署文档',
    items: [
      { name: 'docs/DEPLOYMENT_GUIDE_v0.9.0.md', check: () => exists('docs/DEPLOYMENT_GUIDE_v0.9.0.md') },
      { name: 'docs/SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md', check: () => exists('docs/SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md') },
      { name: 'docs/VAPID_KEY_GENERATION_GUIDE.md', check: () => exists('docs/VAPID_KEY_GENERATION_GUIDE.md') },
      { name: 'docs/TEST_OFFLINE_OPERATIONS.md', check: () => exists('docs/TEST_OFFLINE_OPERATIONS.md') },
      { name: 'docs/TEST_PUSH_NOTIFICATIONS.md', check: () => exists('docs/TEST_PUSH_NOTIFICATIONS.md') },
      { name: 'docs/LIGHTHOUSE_OPTIMIZATION_GUIDE.md', check: () => exists('docs/LIGHTHOUSE_OPTIMIZATION_GUIDE.md') },
    ]
  },
  {
    category: '🔧 实现文件',
    items: [
      { name: 'src/services/pushNotificationService.ts', check: () => exists('src/services/pushNotificationService.ts') },
      { name: 'src/services/offlineOperationQueue.ts', check: () => exists('src/services/offlineOperationQueue.ts') },
      { name: 'src/hooks/useGameStateSelectors.ts', check: () => exists('src/hooks/useGameStateSelectors.ts') },
      { name: 'supabase/functions/filter-game-state/', check: () => exists('supabase/functions/filter-game-state') },
      { name: 'supabase/functions/game-operation/', check: () => exists('supabase/functions/game-operation') },
      { name: 'supabase/functions/push-subscription/', check: () => exists('supabase/functions/push-subscription') },
    ]
  }
];

// 执行检查
let passCount = 0;
let totalCount = 0;

checks.forEach(section => {
  console.log(`${section.category}\n`);

  section.items.forEach(item => {
    totalCount++;
    const passed = item.check();
    if (passed) {
      passCount++;
      console.log(`  ✅ ${item.name}`);
    } else {
      allChecksPass = false;
      console.log(`  ❌ ${item.name}`);
    }
  });

  console.log();
});

// ============================================================================
// 总结
// ============================================================================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const percentage = Math.round((passCount / totalCount) * 100);
console.log(`📊 检查结果: ${passCount}/${totalCount} 项通过 (${percentage}%)\n`);

if (allChecksPass) {
  console.log('✨ 所有检查通过！项目已准备就绪可以部署。\n');
  console.log('📚 下一步：\n');
  console.log('  1. 部署 Supabase Edge Function');
  console.log('     → 参考: docs/SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md\n');
  console.log('  2. 上传到服务器/CDN');
  console.log('     → 使用: npm run build && npm run preview\n');
  console.log('  3. 验证 PWA 功能');
  console.log('     → Chrome DevTools → Lighthouse → PWA\n');
  console.log('  4. 监控性能指标');
  console.log('     → 参考: docs/LIGHTHOUSE_OPTIMIZATION_GUIDE.md\n');
} else {
  console.log('⚠️  还有 ' + (totalCount - passCount) + ' 项检查未通过。\n');
  console.log('💡 建议：\n');
  console.log('  1. 检查缺失的文件是否已创建');
  console.log('  2. 运行: npm run build');
  console.log('  3. 检查 .env.local 配置是否正确');
  console.log('  4. 重新运行此检查脚本\n');
}

// 性能提示
console.log('📈 性能指标：\n');

try {
  const distPath = path.join(projectRoot, 'dist');
  if (fs.existsSync(distPath)) {
    const getDirSize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          size += getDirSize(filePath);
        } else {
          size += stat.size;
        }
      });
      return size;
    };

    const totalSize = getDirSize(distPath);
    console.log(`  📦 总大小: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);

    const assetPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetPath)) {
      const assetSize = getDirSize(assetPath);
      console.log(`  📁 JavaScript 大小: ${(assetSize / 1024).toFixed(1)}KB`);
    }

    const imgPath = path.join(distPath, 'img');
    if (fs.existsSync(imgPath)) {
      const imgSize = getDirSize(imgPath);
      console.log(`  🖼️  图像大小: ${(imgSize / 1024).toFixed(1)}KB`);
    }
  }
} catch (error) {
  console.log('  ⚠️  无法获取包大小信息');
}

console.log();

process.exit(allChecksPass ? 0 : 1);
