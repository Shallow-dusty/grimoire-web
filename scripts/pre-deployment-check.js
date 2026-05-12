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
const serviceWorkerContent = fs.readFileSync(path.join(projectRoot, 'public/service-worker.js'), 'utf-8');
const launchActionContent = fs.readFileSync(path.join(projectRoot, 'src/lib/launchAction.ts'), 'utf-8');
const indexHtmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');
const indexCssContent = fs.readFileSync(path.join(projectRoot, 'src/index.css'), 'utf-8');

const readPngDimensions = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    type: 'image/png',
  };
};

const readJpegDimensions = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
        type: 'image/jpeg',
      };
    }

    offset += 2 + length;
  }

  return null;
};

const readImageDimensions = (assetPath) => {
  const filePath = path.join(projectRoot, 'public', assetPath.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) return null;
  return readPngDimensions(filePath) ?? readJpegDimensions(filePath);
};

const parseManifestSize = (size) => {
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
};

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

const manifestAssetMetadataMatches = () => {
  const assets = [
    ...(manifest.icons ?? []),
    ...(manifest.screenshots ?? []),
    ...(manifest.shortcuts ?? []).flatMap(shortcut => shortcut.icons ?? []),
  ];

  return assets.every(asset => {
    const expectedSize = parseManifestSize(asset.sizes);
    const actual = readImageDimensions(asset.src);
    if (!expectedSize || !actual) return false;
    return actual.width === expectedSize.width &&
      actual.height === expectedSize.height &&
      (!asset.type || actual.type === asset.type);
  });
};

const manifestHasLargeMaskableIcon = () =>
  (manifest.icons ?? []).some(icon => {
    const size = parseManifestSize(icon.sizes);
    return icon.purpose === 'maskable' && Boolean(size) && size.width >= 512 && size.height >= 512;
  });

const shortcutsHaveTypedIcons = () =>
  (manifest.shortcuts ?? []).every(shortcut =>
    (shortcut.icons ?? []).length > 0 &&
    shortcut.icons.every(icon => typeof icon.type === 'string' && icon.type.length > 0)
  );

const shortcutsUseImplementedLaunchActions = () =>
  (manifest.shortcuts ?? []).every(shortcut => {
    const url = new URL(shortcut.url, 'https://example.test');
    const action = url.searchParams.get('action');
    return Boolean(action) && launchActionContent.includes(`'${action}'`);
  });

const serviceWorkerHandlesRuntimePwaEvents = () =>
  serviceWorkerContent.includes("addEventListener('push'") &&
  serviceWorkerContent.includes("addEventListener('notificationclick'") &&
  serviceWorkerContent.includes("addEventListener('message'") &&
  serviceWorkerContent.includes("addEventListener('periodicsync'");

const serviceWorkerHasOfflineAppShellFallback = () =>
  serviceWorkerContent.includes('APP_SHELL_URL') &&
  serviceWorkerContent.includes('getCachedAppShell') &&
  serviceWorkerContent.includes('matchAnyCache');

const htmlReferencedAssetsExist = () => {
  const hrefs = [...indexHtmlContent.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  return hrefs
    .filter(href => href.startsWith('/'))
    .every(href => manifestAssetExists(href) || exists(href.replace(/^\//, '')));
};

const htmlFontLoadingIsConsolidated = () =>
  !indexCssContent.includes('fonts.googleapis.com') &&
  indexHtmlContent.includes('family=Cinzel') &&
  indexHtmlContent.includes('family=Inter') &&
  !indexHtmlContent.includes('Crimson+Text');

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
      { name: 'icon-512-maskable.png', check: () => exists('public/img/icon-512-maskable.png') },
      { name: 'apple-touch-icon.png', check: () => exists('public/img/apple-touch-icon.png') },
      { name: 'manifest 引用资源', check: () => getManifestAssetPaths().every(manifestAssetExists) },
      { name: 'manifest 资源尺寸/类型', check: manifestAssetMetadataMatches },
      { name: 'manifest 512 maskable 图标', check: manifestHasLargeMaskableIcon },
      { name: 'manifest shortcuts 图标类型', check: shortcutsHaveTypedIcons },
      { name: 'manifest shortcuts 已实现', check: shortcutsUseImplementedLaunchActions },
      { name: 'manifest 不声明未实现 share target', check: () => !('share_target' in manifest) },
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
      { name: 'Service Worker PWA 事件', check: serviceWorkerHandlesRuntimePwaEvents },
      { name: 'Service Worker 离线 App Shell', check: serviceWorkerHasOfflineAppShellFallback },
      { name: 'index.html', check: () => exists('index.html') },
      { name: 'index.html 引用资源', check: htmlReferencedAssetsExist },
      { name: '字体加载入口收敛', check: htmlFontLoadingIsConsolidated },
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
