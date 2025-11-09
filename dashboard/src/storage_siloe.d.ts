export interface StorageSiloe {
  id: "aws-s3-vanilla" | "aws-glacier" | "cloudflare-r2" | "minio-on-prem";
  provider: string;
  storageCostPerGBMonth: number;
  egressCostPerGB: number;
  avgLatencyMs: number;
}

export const STORAGE_SILOES: Record<string, StorageSiloe> = {
  "minio-on-prem": {
    id: "minio-on-prem",
    provider: "On-Prem (MinIO)",
    storageCostPerGBMonth: 3, // ~$0.85/GB
    egressCostPerGB: 1,
    avgLatencyMs: 5,
    // bestFor Mission-critical, latency-sensitive data,
  },
  "aws-s3-vanilla": {
    id: "aws-s3-vanilla",
    provider: "AWS S3",
    storageCostPerGBMonth: 2.3, // $0.023/GB
    egressCostPerGB: 9, // $0.09/GB
    avgLatencyMs: 100,
    // bestFor General purpose cloud data,
  },
  "cloudflare-r2": {
    id: "cloudflare-r2",
    provider: "Cloudflare R2",
    storageCostPerGBMonth: 1.5, // $0.015/GB
    egressCostPerGB: 0,
    avgLatencyMs: 150,
    // bestFor Frequently accessed from internet (no egress fees)
  },
  "aws-glacier": {
    id: "aws-glacier",
    provider: "AWS Glacier",
    storageCostPerGBMonth: 0.36, // $0.004/GB
    egressCostPerGB: 9,
    avgLatencyMs: 600000, // 10 minutes
    // bestFor Long-term archive, compliance,
  },
};
