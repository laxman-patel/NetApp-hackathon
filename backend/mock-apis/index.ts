import { STORAGE_SILOES } from "../storage-siloes";
import {
  awsS3Provider,
  cloudflareR2Provider,
  awsGlacierProvider,
  minioProvider,
} from "./providers";

import type { StorageProvider } from "./providers";

export function getStorageProvider(
  id: keyof typeof STORAGE_SILOES,
): StorageProvider {
  const providers = {
    "aws-s3-vanilla": awsS3Provider,
    "cloudflare-r2": cloudflareR2Provider,
    "aws-glacier": awsGlacierProvider,
    "minio-on-prem": minioProvider,
  };

  return providers[id as keyof typeof providers];
}
