import mqtt from "mqtt";
import { readFileSync, writeFileSync } from "fs";
import classifier from "../classifier";

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  client.subscribe("data-access-events");
});

client.on("message", (topic, message) => {
  const event = JSON.parse(message.toString());

  // Load current dataset metadata
  const store = JSON.parse(readFileSync("./src/dataStore.json", "utf8"));
  const dataset = store[event.datasetId];

  if (dataset) {
    // Update access metrics
    dataset.accessCount30d += 1;
    dataset.lastAccessed = event.timestamp;

    // Re-classify storage (this is the key logic)
    const result = classifier(dataset);

    // Save updated state
    writeFileSync("./src/dataStore.json", JSON.stringify(store, null, 2));

    console.log(
      `📥 Processed: ${event.datasetId} | Tier: ${result.tier} | Score: ${dataset.accessCount30d}`,
    );

    if (result.recommendedLocation !== dataset.currentLocation) {
      // Trigger migration
    }
  }
});
