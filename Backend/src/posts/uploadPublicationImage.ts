import { randomUUID } from 'crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getStorage } from 'firebase-admin/storage';
import * as logger from 'firebase-functions/logger';

interface UploadRequest {
  fileName: string;
  contentType: string;
  base64: string;
}

const MAX_BYTES = 200 * 1024 * 1024;

export const uploadPublicationImage = onCall(
  { region: 'us-central1', timeoutSeconds: 300, memory: '1GiB' },
  async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { fileName, contentType, base64 } = (request.data || {}) as UploadRequest;
  if (!fileName || !contentType || !base64) {
    throw new HttpsError('invalid-argument', 'fileName, contentType y base64 son obligatorios');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    throw new HttpsError('invalid-argument', 'base64 inválido');
  }

  if (!buffer.length) {
    throw new HttpsError('invalid-argument', 'Archivo vacío');
  }
  if (buffer.length > MAX_BYTES) {
    throw new HttpsError('invalid-argument', 'Archivo demasiado grande (máx 200MB)');
  }

  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const path = `publicaciones/${request.auth.uid}/${Date.now()}_${safeName}`;
  const bucket = getStorage().bucket();
  const token = randomUUID();

  try {
    await bucket.file(path).save(buffer, {
      metadata: {
        contentType,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
  } catch (err) {
    logger.error('uploadPublicationImage save failed', err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/bucket does not exist|notFound|404/i.test(msg)) {
      throw new HttpsError(
        'failed-precondition',
        'Firebase Storage no está activo. En Firebase Console → Storage → Empezar (plan Blaze). Mientras tanto publica solo texto o usa imagen con URL https.'
      );
    }
    throw new HttpsError('internal', 'No se pudo subir la imagen a Storage');
  }

  const encoded = encodeURIComponent(path);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
  return { url, path };
});
