import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "lab-failure-gallery-dev-routes",
      configureServer(server) {
        server.middlewares.use("/__lab-dev-failure/404.png", (_request, response) => {
          response.statusCode = 404;
          response.end("Sprite deliberately missing for Lab 03");
        });
      },
    },
  ],
});
