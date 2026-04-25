import admin from "firebase-admin";
import { randomUUID } from "node:crypto";
import { env } from "../config/env";
import { logger } from "../lib/logger";

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey,
      }),
      storageBucket: env.firebase.storageBucket,
    });
    logger.info(
      { projectId: env.firebase.projectId },
      "Firebase Admin initialized",
    );
  }
  initialized = true;
}

export function getFirestore(): admin.firestore.Firestore {
  ensureInitialized();
  return admin.firestore();
}

export function getBucket(): ReturnType<typeof admin.storage>["bucket"] extends (
  ...args: infer _A
) => infer R
  ? R
  : never {
  ensureInitialized();
  return admin.storage().bucket();
}

export interface UploadInput {
  buffer: Buffer;
  contentType: string;
  destination: string;
}

export interface UploadResult {
  destination: string;
  publicUrl: string;
}

export async function uploadImage({
  buffer,
  contentType,
  destination,
}: UploadInput): Promise<UploadResult> {
  ensureInitialized();
  const bucket = getBucket();
  const file = bucket.file(destination);
  const downloadToken = randomUUID();

  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const encodedPath = encodeURIComponent(destination);
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  return { destination, publicUrl };
}

export interface PhotoRecord {
  id: string;
  prompt: string;
  createdAt: FirebaseFirestore.Timestamp;
  variants: Record<string, { destination: string; url: string }>;
}

export async function savePhotoRecord(
  data: Omit<PhotoRecord, "id" | "createdAt">,
): Promise<PhotoRecord> {
  const db = getFirestore();
  const docRef = db.collection("photos").doc();
  const createdAt = admin.firestore.Timestamp.now();
  const record: PhotoRecord = { id: docRef.id, createdAt, ...data };
  await docRef.set(record);
  return record;
}

export async function getPhotoRecord(id: string): Promise<PhotoRecord | null> {
  const db = getFirestore();
  const snap = await db.collection("photos").doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as PhotoRecord;
}
