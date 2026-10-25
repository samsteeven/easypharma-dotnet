import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test-setup.ts'],
        alias: {
            '@app': path.resolve(__dirname, './src/app'),
            '@components': path.resolve(__dirname, './src/app/components'),
            '@core': path.resolve(__dirname, './src/app/core'),
            '@env': path.resolve(__dirname, './src/environments'),
            '@guards': path.resolve(__dirname, './src/app/guards'),
            '@services': path.resolve(__dirname, './src/app/services'),
            '@models': path.resolve(__dirname, './src/app/models'),
        }
    },
});
