import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "lab-failure-gallery",
      configureServer(server) {
        server.middlewares.use("/__lab-failure/404.png", (_request, response) => {
          response.statusCode = 404;
          response.end("Sprite deliberately missing for Lab 03");
        });
        server.middlewares.use("/__lab-failure/bad.json", (_request, response) => {
          response.setHeader("Content-Type", "application/json");
          response.end("{ not valid json }");
        });
      },
    },
  ],
});
