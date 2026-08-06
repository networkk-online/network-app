import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// The Lovable component tagger is a dev-only convenience. It is loaded
// lazily and optionally so that external CI (Vercel / Netlify / GitHub
// Actions) can build the project even when the package is unavailable.
async function optionalTagger(mode: string): Promise<PluginOption | null> {
  if (mode !== "development") return null;
  try {
    const mod = await import("lovable-tagger");
    return mod.componentTagger();
  } catch {
    return null;
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), await optionalTagger(mode)].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
