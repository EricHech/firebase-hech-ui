// vite.config.mjs
import { resolve } from "path";
import { defineConfig } from "file:///Users/erichechavarria/Code/firebase-hech-ui/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/erichechavarria/Code/firebase-hech-ui/node_modules/vite-plugin-dts/dist/index.mjs";
import { externalizeDeps } from "file:///Users/erichechavarria/Code/firebase-hech-ui/node_modules/vite-plugin-externalize-deps/dist/index.js";
var __vite_injected_original_dirname = "/Users/erichechavarria/Code/firebase-hech-ui";
var vite_config_default = defineConfig({
  plugins: [
    dts({
      outDir: "./dist/types"
      // ... other options if needed ...
    }),
    externalizeDeps()
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "firebase-hech-ui",
      fileName: (format, name) => `${name}.${format === "es" ? "m" : "c"}js`
    },
    rollupOptions: {
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {}
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2VyaWNoZWNoYXZhcnJpYS9Db2RlL2ZpcmViYXNlLWhlY2gtdWlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9lcmljaGVjaGF2YXJyaWEvQ29kZS9maXJlYmFzZS1oZWNoLXVpL3ZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZXJpY2hlY2hhdmFycmlhL0NvZGUvZmlyZWJhc2UtaGVjaC11aS92aXRlLmNvbmZpZy5tanNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgZHRzIGZyb20gXCJ2aXRlLXBsdWdpbi1kdHNcIjtcbmltcG9ydCB7IGV4dGVybmFsaXplRGVwcyB9IGZyb20gXCJ2aXRlLXBsdWdpbi1leHRlcm5hbGl6ZS1kZXBzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBkdHMoe1xuICAgICAgb3V0RGlyOiBcIi4vZGlzdC90eXBlc1wiLFxuICAgICAgLy8gLi4uIG90aGVyIG9wdGlvbnMgaWYgbmVlZGVkIC4uLlxuICAgIH0pLFxuICAgIGV4dGVybmFsaXplRGVwcygpLFxuICBdLFxuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgLy8gQ291bGQgYWxzbyBiZSBhIGRpY3Rpb25hcnkgb3IgYXJyYXkgb2YgbXVsdGlwbGUgZW50cnkgcG9pbnRzXG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL2luZGV4LnRzXCIpLFxuICAgICAgbmFtZTogXCJmaXJlYmFzZS1oZWNoLXVpXCIsXG4gICAgICBmaWxlTmFtZTogKGZvcm1hdCwgbmFtZSkgPT4gYCR7bmFtZX0uJHtmb3JtYXQgPT09IFwiZXNcIiA/IFwibVwiIDogXCJjXCJ9anNgLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIFByb3ZpZGUgZ2xvYmFsIHZhcmlhYmxlcyB0byB1c2UgaW4gdGhlIFVNRCBidWlsZFxuICAgICAgICAvLyBmb3IgZXh0ZXJuYWxpemVkIGRlcHNcbiAgICAgICAgZ2xvYmFsczoge30sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1QsU0FBUyxlQUFlO0FBQ2hWLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixRQUFRO0FBQUE7QUFBQSxJQUVWLENBQUM7QUFBQSxJQUNELGdCQUFnQjtBQUFBLEVBQ2xCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUE7QUFBQSxNQUVILE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDeEMsTUFBTTtBQUFBLE1BQ04sVUFBVSxDQUFDLFFBQVEsU0FBUyxHQUFHLElBQUksSUFBSSxXQUFXLE9BQU8sTUFBTSxHQUFHO0FBQUEsSUFDcEU7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBO0FBQUEsUUFHTixTQUFTLENBQUM7QUFBQSxNQUNaO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
