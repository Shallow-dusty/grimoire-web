import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(projectRoot, 'public');

interface ManifestImage {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

interface ManifestShortcut {
  url: string;
  icons?: ManifestImage[];
}

interface WebManifest {
  icons?: ManifestImage[];
  screenshots?: ManifestImage[];
  shortcuts?: ManifestShortcut[];
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(publicDir, 'manifest.json'), 'utf-8')
) as WebManifest;
const launchActionSource = fs.readFileSync(
  path.join(projectRoot, 'src/lib/launchAction.ts'),
  'utf-8'
);
const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');
const indexCss = fs.readFileSync(path.join(projectRoot, 'src/index.css'), 'utf-8');

const getAssetPath = (src: string) => path.join(publicDir, src.replace(/^\//, ''));

const parseSize = (size: string) => {
  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) throw new Error(`Invalid manifest size: ${size}`);
  return { width: Number(match[1]), height: Number(match[2]) };
};

const readPngDimensions = (filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    type: 'image/png',
  };
};

const readJpegDimensions = (filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  expect(buffer[0]).toBe(0xff);
  expect(buffer[1]).toBe(0xd8);

  let offset = 2;
  while (offset + 3 < buffer.length) {
    expect(buffer[offset]).toBe(0xff);
    const marker = buffer[offset + 1] ?? 0;
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

  throw new Error(`Could not read JPEG dimensions: ${filePath}`);
};

const readImageDimensions = (asset: ManifestImage) => {
  const filePath = getAssetPath(asset.src);
  if (asset.type === 'image/png') return readPngDimensions(filePath);
  if (asset.type === 'image/jpeg') return readJpegDimensions(filePath);
  throw new Error(`Unsupported manifest asset type: ${asset.type ?? '(missing)'}`);
};

describe('PWA manifest and service worker assets', () => {
  it('references existing image assets with correct dimensions and MIME types', () => {
    const assets = [
      ...(manifest.icons ?? []),
      ...(manifest.screenshots ?? []),
      ...(manifest.shortcuts ?? []).flatMap(shortcut => shortcut.icons ?? []),
    ];

    expect(assets.length).toBeGreaterThan(0);

    for (const asset of assets) {
      const expectedSize = parseSize(asset.sizes);
      const filePath = getAssetPath(asset.src);
      expect(fs.existsSync(filePath), asset.src).toBe(true);

      const actual = readImageDimensions(asset);
      expect(actual).toEqual({
        ...expectedSize,
        type: asset.type,
      });
    }
  });

  it('provides a large maskable icon for install surfaces', () => {
    const largeMaskableIcon = (manifest.icons ?? []).find(icon => {
      const size = parseSize(icon.sizes);
      return icon.purpose === 'maskable' && size.width >= 512 && size.height >= 512;
    });

    expect(largeMaskableIcon?.src).toBe('/img/icon-512-maskable.png');
  });

  it('keeps service worker runtime handlers wired for offline and notification flows', () => {
    const serviceWorker = fs.readFileSync(path.join(publicDir, 'service-worker.js'), 'utf-8');

    expect(serviceWorker).toContain("addEventListener('push'");
    expect(serviceWorker).toContain("addEventListener('notificationclick'");
    expect(serviceWorker).toContain("addEventListener('periodicsync'");
    expect(serviceWorker).toContain("addEventListener('message'");
    expect(serviceWorker).toContain('getCachedAppShell');
    expect(serviceWorker).toContain('matchAnyCache');
    expect(serviceWorker).not.toContain('console.log');
  });

  it('keeps manifest shortcuts aligned with implemented launch actions', () => {
    expect('share_target' in manifest).toBe(false);

    const shortcutUrls = (manifest.shortcuts ?? []).map(shortcut => {
      const url = new URL(shortcut.url, 'https://example.test');
      return url.searchParams.get('action');
    });

    expect(shortcutUrls).toEqual(['create-room', 'join-room']);
    for (const action of shortcutUrls) {
      expect(launchActionSource).toContain(`'${action}'`);
    }
  });

  it('keeps shell icons and font loading aligned with committed assets', () => {
    expect(indexHtml).not.toContain('/vite.svg');
    expect(indexHtml).toContain('/img/icon-192.png');
    expect(indexHtml).toContain('/img/apple-touch-icon.png');
    expect(indexHtml).toContain('family=Cinzel');
    expect(indexHtml).toContain('family=Inter');
    expect(indexHtml).not.toContain('Crimson+Text');
    expect(indexCss).not.toContain('fonts.googleapis.com');

    const localHrefs = [...indexHtml.matchAll(/href="([^"]+)"/g)]
      .flatMap(match => match[1] ? [match[1]] : [])
      .filter(href => href.startsWith('/'));

    for (const href of localHrefs) {
      expect(fs.existsSync(getAssetPath(href)) || fs.existsSync(path.join(projectRoot, href))).toBe(true);
    }
  });
});
