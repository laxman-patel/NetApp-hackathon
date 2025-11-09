import { getStorageProvider } from ".";
import { STORAGE_SILOES } from "../storage-siloes";

export async function executeMigration(
  datasetId: string,
  fromLocation: keyof typeof STORAGE_SILOES,
  toLocation: keyof typeof STORAGE_SILOES,
) {
  const source = getStorageProvider(fromLocation);
  const dest = getStorageProvider(toLocation);

  const start = Date.now();

  const { data, latency: downloadLatency } = await source.download(datasetId);

  const { etag, latency: uploadLatency } = await dest.upload(datasetId, data);

  await source.delete(datasetId);

  return {
    success: true,
    bytes: data.length,
    totalLatency: Date.now() - start,
    etag,
    location: toLocation,
  };
}
