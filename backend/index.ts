import { readFileSync } from "fs";
import { listMigrationJobs } from "./mock-apis/migration";
import { executeClassification } from "./classifier";

Bun.serve({
  port: 3001,

  async fetch(req) {
    const url = new URL(req.url);

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (url.pathname === "/api/getMigrations") {
      const migrationJobs = await listMigrationJobs();

      return new Response(JSON.stringify(migrationJobs), {
        headers,
      });
    }

    if (url.pathname === "/api/getDataStore") {
      try {
        const store = JSON.parse(readFileSync("./dataStore.json", "utf8"));
        return new Response(JSON.stringify(store), {
          headers,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Failed to load data store" }),
          { status: 500, headers },
        );
      }
    }

    if (url.pathname === "/api/getPredictions") {
      try {
        const store = JSON.parse(readFileSync("./predictions.json", "utf8"));
        return new Response(JSON.stringify(store), {
          headers,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Failed to predictions" }),
          { status: 500, headers },
        );
      }
    }

    if (url.pathname === "/api/executeClassifications") {
      try {
        await executeClassification();
        return new Response("OK", { status: 200, headers });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Failed to execute classification" }),
          { status: 500, headers },
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log("http://localhost:3001/api/dashboard");
