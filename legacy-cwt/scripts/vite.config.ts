import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Handle large assets like video files
    assetsInlineLimit: 0, // Don't inline any assets
    rollupOptions: {
      output: {
        // Don't hash large video files
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.mov')) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  server: {
    host: "0.0.0.0", // Allow external connections for Codespaces
    port: 6173,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 24678, // Different port for HMR to avoid conflicts
    },
    // Codespace optimization
    watch: {
      usePolling: true,
      interval: 1000,
    },
    // Proxy API calls to the backend server
    proxy: {
      "/api": {
        target: "http://localhost:6001",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward cookies from the original request
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
          });
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            // Forward set-cookie headers from the backend
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              res.setHeader('set-cookie', setCookieHeaders);
            }
          });
        },
      },
    },
  },
});
