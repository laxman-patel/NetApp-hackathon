import mqtt from "mqtt";
import { readFileSync, writeFileSync } from "fs";
import classifier from "../classifier";
import { executeMigration } from "../mock-apis/migration";

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  client.subscribe("data-access-events");
});

client.on("message", async (topic, message) => {
  const event = JSON.parse(message.toString());

  const store = JSON.parse(readFileSync("./src/dataStore.json", "utf8"));
  const dataset = store[event.datasetId];

  if (dataset) {
    dataset.accessCount30d += 1;
    dataset.lastAccessed = event.timestamp;

    const result = classifier(dataset);

    writeFileSync("./src/dataStore.json", JSON.stringify(store, null, 2));

    if (result.recommendedLocation !== dataset.currentLocation) {
      await executeMigration(
        event.datasetId,
        dataset.currentLocation,
        result.recommendedLocation,
      );

      console.log(
        `Migrated ${event.datasetId} from ${dataset.currentLocation} to ${result.recommendedLocation}`,
      );
    }
  }
});
