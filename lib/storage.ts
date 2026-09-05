import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Storage abstraction. Two drivers selected via STORAGE_DRIVER env var:
 *  - "local" (default): writes to UPLOAD_DIR (./uploads) on the server disk
 *  - "s3": S3-compatible object storage (e.g. MinIO) via the AWS SDK
 */

export interface StoredFile {
  body: Buffer | ReadableStream;
}

export interface StoredFileMetadata {
  size: number | null;
}

export interface StorageDriver {
  save(body: Buffer, key: string, mimeType: string): Promise<void>;
  get(key: string): Promise<StoredFile | null>;
  metadata(key: string): Promise<StoredFileMetadata | null>;
  remove(key: string): Promise<void>;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

// ---------- local disk driver ----------

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

const localDriver: StorageDriver = {
  async save(body, key) {
    const dir = uploadRoot();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, key), body);
  },
  async get(key) {
    try {
      const body = await fs.readFile(path.join(uploadRoot(), key));
      return { body };
    } catch {
      return null;
    }
  },
  async metadata(key) {
    try {
      const stats = await fs.stat(path.join(uploadRoot(), key));
      return { size: stats.size };
    } catch {
      return null;
    }
  },
  async remove(key) {
    await fs.unlink(path.join(uploadRoot(), key)).catch(() => {});
  },
};

// ---------- S3 / MinIO driver (SDK loaded lazily) ----------

type S3ClientType = import("@aws-sdk/client-s3").S3Client;
let s3ClientInstance: S3ClientType | null = null;

async function s3Client(): Promise<S3ClientType> {
  if (s3ClientInstance) return s3ClientInstance;
  const { S3Client } = await import("@aws-sdk/client-s3");
  s3ClientInstance = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: true, // required by MinIO
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
  });
  return s3ClientInstance;
}

const s3Driver: StorageDriver = {
  async save(body, key, mimeType) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  },
  async get(key) {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3Client();
    try {
      const res = await client.send(
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      );
      if (!res.Body) return null;
      const body = (res.Body as { transformToWebStream(): ReadableStream }).transformToWebStream();
      return { body };
    } catch {
      return null;
    }
  },
  async metadata(key) {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3Client();
    try {
      const res = await client.send(
        new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      );
      return { size: typeof res.ContentLength === "number" ? res.ContentLength : null };
    } catch {
      return null;
    }
  },
  async remove(key) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3Client();
    await client
      .send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }))
      .catch(() => {});
  },
};

// ---------- public API ----------

function driver(): StorageDriver {
  return process.env.STORAGE_DRIVER === "s3" ? s3Driver : localDriver;
}

async function optimizeImage(file: File): Promise<{ body: Buffer; mimeType: string }> {
  const body = Buffer.from(await file.arrayBuffer());
  if (file.type === "image/gif") {
    return { body, mimeType: file.type };
  }

  const sharp = (await import("sharp")).default;
  let pipeline = sharp(body).rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true });
  if (file.type === "image/png") {
    pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: 80 });
  } else if (file.type === "image/webp") {
    pipeline = pipeline.webp({ quality: 82 });
  } else {
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
  }
  return { body: await pipeline.toBuffer(), mimeType: file.type };
}

/** Saves an uploaded file, optimizing supported raster images to conserve storage. */
export async function saveMedia(file: File): Promise<{ key: string; mimeType: string }> {
  const stored = file.type.startsWith("image/")
    ? await optimizeImage(file)
    : { body: Buffer.from(await file.arrayBuffer()), mimeType: file.type };
  const ext = EXT_BY_MIME[stored.mimeType] ?? path.extname(file.name).toLowerCase();
  const key = `${randomUUID()}${ext}`;
  await driver().save(stored.body, key, stored.mimeType);
  return { key, mimeType: stored.mimeType };
}

export async function getMedia(key: string): Promise<StoredFile | null> {
  return driver().get(key);
}

export async function getMediaMetadata(key: string): Promise<StoredFileMetadata | null> {
  return driver().metadata(key);
}

export async function deleteMedia(key: string): Promise<void> {
  return driver().remove(key);
}
