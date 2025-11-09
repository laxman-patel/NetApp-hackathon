import { readFileSync } from "fs";

Bun.serve({
  port: 3001,

  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/dashboard") {
      try {
        const store = JSON.parse(readFileSync("./src/dataStore.json", "utf8"));
        const ml_predicitions = JSON.parse(
          readFileSync("./src/predictions.json", "utf8"),
        );

        const activeMigrations = [];

        return new Response(
          JSON.stringify({
            datasets: Object.values(store),
            predictions: ml_predicitions,
            activeMigrations,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Failed to load dashboard data" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log("http://localhost:3001/api/dashboard");
