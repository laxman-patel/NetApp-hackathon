import { STORAGE_SILOES } from "./storage-siloes";
import type { StorageSiloe } from "./storage-siloes";

export interface DatasetMetadata {
  name: string;
  sizeGB: number;
  accessCount30d: number;
  lastAccessed: string;
  currentLocation?: keyof typeof STORAGE_SILOES;
  latencySensitivity: "critical" | "high" | "medium" | "low";
  egressPattern: "high" | "medium" | "low";
  businessPriority: 1 | 2 | 3 | 4 | 5;
}

export interface ClassificationResult {
  recommendedLocation: keyof typeof STORAGE_SILOES;
  tier: "hot" | "warm" | "cold";
  estimatedMonthlyCost: number;
}

export default function classifier(
  metadata: DatasetMetadata,
): ClassificationResult {
  const tier = calculateDataTier(metadata);

  const viableStorages = getViableStorages(tier, metadata.latencySensitivity);

  const recommended = selectCheapestStorage(metadata, viableStorages);

  return {
    recommendedLocation: recommended.id,
    tier,
    estimatedMonthlyCost: calculateTotalCost(metadata, recommended),
  };
}

function calculateDataTier(metadata: DatasetMetadata): "hot" | "warm" | "cold" {
  const daysSinceAccess =
    (Date.now() - new Date(metadata.lastAccessed).getTime()) /
    (1000 * 60 * 60 * 24);

  const recencyScore = Math.max(0, 30 - daysSinceAccess) * 2;

  const frequencyScore = Math.min(metadata.accessCount30d * 1.5, 100);

  const priorityScore = (6 - metadata.businessPriority) * 20;

  const totalScore = recencyScore + frequencyScore + priorityScore;

  if (totalScore > 80) return "hot";
  if (totalScore > 30) return "warm";
  return "cold";
}

function getViableStorages(
  tier: "hot" | "warm" | "cold",
  sensitivity: "critical" | "high" | "medium" | "low",
): StorageSiloe[] {
  const sensitivityThresholds = {
    critical: 50,
    high: 200,
    medium: 2000,
    low: Infinity,
  };

  const tierLimits = {
    hot: 200,
    warm: 2000,
    cold: Infinity,
  };

  const maxLatency = Math.min(
    sensitivityThresholds[sensitivity],
    tierLimits[tier],
  );

  return Object.values(STORAGE_SILOES).filter(
    (storage) => storage.avgLatencyMs <= maxLatency,
  );
}

export function calculateTotalCost(
  metadata: DatasetMetadata,
  storage: StorageSiloe,
): number {
  const storageCost = metadata.sizeGB * storage.storageCostPerGBMonth;

  const egressRates = {
    high: 0.3,
    medium: 0.1,
    low: 0.01,
  };

  const egressMultiplier = egressRates[metadata.egressPattern];

  const egressCost =
    metadata.sizeGB * egressMultiplier * storage.egressCostPerGB;

  return storageCost + egressCost;
}

function selectCheapestStorage(
  metadata: DatasetMetadata,
  viableStorages: StorageSiloe[],
): StorageSiloe {
  const candidates =
    viableStorages.length > 0 ? viableStorages : Object.values(STORAGE_SILOES);

  return candidates.reduce((cheapest, current) => {
    const cheapestCost = calculateTotalCost(metadata, cheapest);
    const currentCost = calculateTotalCost(metadata, current);
    return currentCost < cheapestCost ? current : cheapest;
  });
}
