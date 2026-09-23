import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          gsap: ["gsap", "@gsap/react"],
        },
      },
    },
  },
  server: {
    // 5173 la cua customer-frontend nay, 5174 la cua admin-frontend.
    port: 5173,
    // strictPort: bao loi ngay neu 5173 dang ban, thay vi lang le nhay sang 5174.
    //
    // De false thi vite nhay sang 5174 - dung cong cua admin-frontend - va neu admin
    // dang chay thi hai app giam chan nhau. Gateway chi cho phep dung hai origin 5173
    // va 5174. Giao dien bao "Khong the ket noi toi server,
    // kiem tra backend da chay chua" - chi sai huong hoan toan, vi backend van chay tot.
    // Hong som va hong ro rang thi de tim hon nhieu.
    strictPort: true,
  },
});
