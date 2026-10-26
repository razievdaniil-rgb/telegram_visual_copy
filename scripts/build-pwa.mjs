import { generateSW } from 'workbox-build';
import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('dist/fonts', { recursive: true });
for (const face of ['Regular', 'Medium', 'SemiBold', 'Bold']) {
  await copyFile(`assets/fonts/Inter-${face}.ttf`, `dist/fonts/Inter-${face}.ttf`);
}
const result = await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json,webmanifest,png,jpg,jpeg,svg,ttf,woff2,ico}'],
  globIgnores: ['**/*.map', 'sw.js', 'workbox-*.js'],
  swDest: 'dist/sw.js',
  maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/_expo\//, /\.[a-z0-9]+$/i],
  cleanupOutdatedCaches: true,
  skipWaiting: false,
  clientsClaim: false,
  sourcemap: false,
});
if (result.warnings.length) throw new Error(result.warnings.join('\n'));
console.log(`PWA: ${result.count} resources, ${result.size} bytes precached`);
