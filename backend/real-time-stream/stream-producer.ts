import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  setInterval(
    () => {
      const event = {
        datasetId: ["dataset_001", "dataset_002", "dataset_003"][
          Math.floor(Math.random() * 3)
        ],
        timestamp: new Date().toISOString(),
        accessType: "read",
      };

      client.publish("data-access-events", JSON.stringify(event));
      console.log(`Event Published ${event.datasetId}`);
    },

    1000 + Math.random() * 2000, // access events every 1-3 seconds
  );
});
