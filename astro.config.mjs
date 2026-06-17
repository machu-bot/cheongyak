import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://machu-bot.github.io',
  base: '/cheongyak',
  server: { host: '0.0.0.0', port: 4321 },
});
