// migrations-service-metadata.ts
import fs from "fs/promises";
import path from "path";
import { STORAGE_SILOES } from "../storage-siloes";
import type { DatasetMetadata } from "../classifier";
import { v4 as uuidv4 } from "uuid";

export interface MigrationJob {
  id: string;
  datasetName: string;
  datasetMetadata?: DatasetMetadata;
  source: keyof typeof STORAGE_SILOES;
  destination: keyof typeof STORAGE_SILOES;
  status: "running" | "completed" | "failed";
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  throughputMBps: number;
  throughputNetworkMBps?: number;
  startTime: string;
  endTime?: string;
  lastError?: string;
  notes?: string;
}

const MIGRATIONS_FILE =
  process.env.MIGRATIONS_FILE || path.resolve(process.cwd(), "migrations.json");

function generateId() {
  return uuidv4();
}

async function loadMigrations(): Promise<MigrationJob[]> {
  try {
    const raw = await fs.readFile(MIGRATIONS_FILE, "utf8");
    return JSON.parse(raw) as MigrationJob[];
  } catch (_err) {
    return [];
  }
}

async function saveMigrations(list: MigrationJob[]) {
  await fs.writeFile(MIGRATIONS_FILE, JSON.stringify(list, null, 2), "utf8");
}

async function upsertJob(job: Partial<MigrationJob> & { id: string }) {
  const list = await loadMigrations();
  const idx = list.findIndex((j) => j.id === job.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...job } as MigrationJob;
  else list.push(job as MigrationJob);
  await saveMigrations(list);
}

async function createJob(initial: Omit<MigrationJob, "id">) {
  const id = generateId();
  const job: MigrationJob = { id, ...initial };
  await upsertJob(job);
  return job;
}

const simulateDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function executeMigration(
  dataset: DatasetMetadata,
  fromLocation: keyof typeof STORAGE_SILOES,
  toLocation: keyof typeof STORAGE_SILOES,
) {
  const startIso = new Date().toISOString();
  const totalBytes = Math.round(dataset.sizeGB * 1024 * 1024 * 1024); // bytes (GiB -> bytes)
  const t0 = Date.now();

  const job = await createJob({
    datasetName: dataset.name,
    datasetMetadata: dataset,
    source: fromLocation,
    destination: toLocation,
    status: "running",
    progress: 0,
    bytesTransferred: 0,
    totalBytes,
    throughputMBps: 0,
    startTime: startIso,
  });

  const jobId = job.id;

  try {
    const fromLatency =
      (STORAGE_SILOES[fromLocation] &&
        (STORAGE_SILOES[fromLocation] as any).avgLatencyMs) ||
      0;
    const toLatency =
      (STORAGE_SILOES[toLocation] &&
        (STORAGE_SILOES[toLocation] as any).avgLatencyMs) ||
      0;

    await upsertJob({ id: jobId, progress: 5 });
    if (fromLatency > 0) await simulateDelay(fromLatency);

    await upsertJob({
      id: jobId,
      progress: 35,
      bytesTransferred: Math.round(totalBytes * 0.35),
    });

    if (toLatency > 0) await simulateDelay(toLatency);

    const cleanupDelay = 20; // ms
    await simulateDelay(cleanupDelay);

    const end = Date.now();
    const elapsedMs = Math.max(1, end - t0); // avoid division by zero
    const networkSimulatedMs = Math.max(1, fromLatency + toLatency); // at least 1 ms

    const bytes = totalBytes;
    const secondsObserved = elapsedMs / 1000;
    const secondsNetwork = networkSimulatedMs / 1000;

    const throughputMBps =
      bytes > 0 ? bytes / secondsObserved / (1024 * 1024) : 0; // MiB/s observed
    const throughputNetworkMBps =
      bytes > 0 ? bytes / secondsNetwork / (1024 * 1024) : 0; // MiB/s simulated network-only

    await upsertJob({
      id: jobId,
      status: "completed",
      progress: 100,
      bytesTransferred: bytes,
      throughputMBps: Number(throughputMBps.toFixed(3)),
      throughputNetworkMBps: Number(throughputNetworkMBps.toFixed(3)),
      endTime: new Date().toISOString(),
      notes: `Simulated fromLatency=${fromLatency}ms toLatency=${toLatency}ms cleanupDelay=${cleanupDelay}ms`,
    });

    return {
      success: true,
      jobId,
      totalBytes: bytes,
      totalLatencyMs: elapsedMs,
      throughputMBps: Number(throughputMBps.toFixed(3)),
      throughputNetworkMBps: Number(throughputNetworkMBps.toFixed(3)),
    };
  } catch (err: any) {
    const message = err && err.message ? err.message : String(err);
    await upsertJob({
      id: jobId,
      status: "failed",
      lastError: message,
      endTime: new Date().toISOString(),
    });
    return { success: false, jobId, error: message };
  }
}

export async function listMigrationJobs(): Promise<MigrationJob[]> {
  return loadMigrations();
}

export async function getMigrationJob(
  id: string,
): Promise<MigrationJob | undefined> {
  const list = await loadMigrations();
  return list.find((j) => j.id === id);
}
