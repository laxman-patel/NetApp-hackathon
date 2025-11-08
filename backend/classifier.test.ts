import type { DatasetMetadata } from "./classifier";
import classifier, { calculateTotalCost } from "./classifier";
import { STORAGE_SILOES, type StorageSiloe } from "./storage-siloes";

export const MOCK_DATASETS: DatasetMetadata[] = [
  // ========== HOT TIER TESTS ==========
  {
    name: "realtime-analytics-stream",
    sizeGB: 75,
    accessCount30d: 800, // Very active
    lastAccessed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "critical",
    egressPattern: "high",
    businessPriority: 1,
    // Expected: HOT, minio-on-prem (only <50ms option for critical)
  },
  {
    name: "cdn-static-assets",
    sizeGB: 300,
    accessCount30d: 1200, // Extremely active
    lastAccessed: new Date(Date.now()).toISOString(), // Right now
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "medium",
    egressPattern: "high", // High egress = R2 saves money
    businessPriority: 2,
    // Expected: HOT, cloudflare-r2 (saves $270/mo in egress fees)
  },
  {
    name: "user-profile-data",
    sizeGB: 25,
    accessCount30d: 400,
    lastAccessed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    currentLocation: "cloudflare-r2",
    latencySensitivity: "high",
    egressPattern: "medium",
    businessPriority: 1,
    // Expected: HOT, minio-on-prem (latency <200ms + priority 1)
  },
  {
    name: "app-event-logs",
    sizeGB: 500,
    accessCount30d: 600,
    lastAccessed: new Date(Date.now() - 86400000).toISOString(),
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "medium",
    egressPattern: "medium",
    businessPriority: 2,
    // Expected: HOT, aws-s3-vanilla (cheapest hot option for this pattern)
  },

  // ========== WARM TIER TESTS ==========
  {
    name: "monthly-report-archive",
    sizeGB: 50,
    accessCount30d: 45,
    lastAccessed: new Date(Date.now() - 7 * 86400000).toISOString(), // 1 week ago
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "medium",
    egressPattern: "low",
    businessPriority: 3,
    // Expected: WARM, cloudflare-r2 (slightly cheaper than S3)
  },
  {
    name: "staging-db-snapshots",
    sizeGB: 200,
    accessCount30d: 20,
    lastAccessed: new Date(Date.now() - 5 * 86400000).toISOString(),
    currentLocation: "minio-on-prem",
    latencySensitivity: "high",
    egressPattern: "low",
    businessPriority: 3,
    // Expected: WARM, aws-s3-vanilla (meets <2000ms, cheaper than on-prem)
  },
  {
    name: "old-api-versions",
    sizeGB: 15,
    accessCount30d: 10,
    lastAccessed: new Date(Date.now() - 14 * 86400000).toISOString(), // 2 weeks ago
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "low",
    egressPattern: "medium",
    businessPriority: 4,
    // Expected: WARM, cloudflare-r2 (prioritize cost savings)
  },

  // ========== COLD TIER TESTS ==========
  {
    name: "2019-customer-backup",
    sizeGB: 1000,
    accessCount30d: 0,
    lastAccessed: new Date(Date.now() - 365 * 86400000).toISOString(), // 1 year ago
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "low",
    egressPattern: "low",
    businessPriority: 5,
    // Expected: COLD, aws-glacier (cheapest storage for dead data)
  },
  {
    name: "legacy-analytics-data",
    sizeGB: 200,
    accessCount30d: 1,
    lastAccessed: new Date(Date.now() - 90 * 86400000).toISOString(), // 3 months ago
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "low",
    egressPattern: "low",
    businessPriority: 5,
    // Expected: COLD, aws-glacier (access once in 3 months = archive it)
  },
  {
    name: "compliance-audit-logs",
    sizeGB: 300,
    accessCount30d: 2,
    lastAccessed: new Date(Date.now() - 60 * 86400000).toISOString(),
    currentLocation: "cloudflare-r2",
    latencySensitivity: "low",
    egressPattern: "low",
    businessPriority: 4,
    // Expected: COLD, aws-glacier (legal hold but rarely accessed)
  },

  // ========== EDGE CASES ==========
  {
    name: "disaster-recovery-drill",
    sizeGB: 100,
    accessCount30d: 0, // Never accessed
    lastAccessed: new Date(Date.now() - 180 * 86400000).toISOString(), // 6 months ago
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "critical", // But needs to be instant when needed!
    egressPattern: "low",
    businessPriority: 1, // Critical despite zero access
    // Expected: WARM, minio-on-prem (priority 1 + latency override)
  },
  {
    name: "large-public-dataset",
    sizeGB: 5000, // 5TB - size matters
    accessCount30d: 100,
    lastAccessed: new Date(Date.now() - 3 * 86400000).toISOString(),
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "medium",
    egressPattern: "high", // Public downloads = massive egress
    businessPriority: 2,
    // Expected: WARM/HOT, cloudflare-r2 (saves $4500/mo in egress at 30% rate)
  },
  {
    name: "quarterly-financials",
    sizeGB: 10,
    accessCount30d: 5,
    lastAccessed: new Date(Date.now() - 45 * 86400000).toISOString(), // 45 days ago
    currentLocation: "aws-glacier",
    latencySensitivity: "high",
    egressPattern: "low",
    businessPriority: 2,
    // Expected: WARM, aws-s3-vanilla (high latency needs + accessed quarterly)
  },
  {
    name: "temp-processing-data",
    sizeGB: 100,
    accessCount30d: 500, // Very active
    lastAccessed: new Date(Date.now() - 86400000).toISOString(),
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "low",
    egressPattern: "high",
    businessPriority: 5, // But low priority
    // Expected: HOT, cloudflare-r2 (access pattern overrides low priority)
  },
  {
    name: "ml-training-data",
    sizeGB: 500,
    accessCount30d: 0, // Accessed once then sits
    lastAccessed: new Date(Date.now() - 7 * 86400000).toISOString(),
    currentLocation: "aws-s3-vanilla",
    latencySensitivity: "medium",
    egressPattern: "low",
    businessPriority: 3,
    // Expected: COLD, aws-glacier (one-time use = archive)
  },
];

// ========== TEST RUNNER ==========
export function runClassificationTests() {
  console.log("🧪 Running mock dataset classification tests...\n");

  MOCK_DATASETS.forEach((dataset, index) => {
    const result = classifier(dataset);
    const currentCost = dataset.currentLocation
      ? calculateTotalCost(
          dataset,
          STORAGE_SILOES[dataset.currentLocation] as StorageSiloe,
        )
      : 0;
    const savings = (currentCost - result.estimatedMonthlyCost) / 100;

    console.log(`${index + 1}. ${dataset.name}`);
    console.log(
      `   Size: ${dataset.sizeGB}GB | Access: ${dataset.accessCount30d}/30d | Priority: P${dataset.businessPriority}`,
    );
    console.log(
      `   Current: ${dataset.currentLocation || "none"} → Recommended: ${result.recommendedLocation}`,
    );
    console.log(
      `   Tier: ${result.tier.toUpperCase()} | Cost: $${(result.estimatedMonthlyCost / 100).toFixed(2)}/mo`,
    );
    if (savings > 0) {
      console.log(`   💰 Savings: $${savings.toFixed(2)}/mo`);
    }
    console.log("");
  });
}

runClassificationTests();
