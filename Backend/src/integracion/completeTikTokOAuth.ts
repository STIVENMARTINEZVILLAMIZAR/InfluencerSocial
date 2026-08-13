import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  exchangeTikTokCode,
  fetchTikTokCreatorInfo,
  fetchTikTokUserInfo,
} from './tiktokOAuthApi';

export const completeTikTokOAuth = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { code, state } = request.data as { code?: string; state?: string };
  if (!code?.trim() || !state?.trim()) {
    throw new HttpsError('invalid-argument', 'code y state son obligatorios');
  }

  const uid = request.auth.uid;
  const db = getFirestore();
  const pendingRef = db.collection('oauth_tiktok_pending').doc(state.trim());
  const pendingSnap = await pendingRef.get();

  if (!pendingSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'Sesión OAuth expirada o inválida. Vuelve a Canales → Conectar TikTok e inicia el flujo de nuevo (no recargues esta página).'
    );
  }

  const pending = pendingSnap.data()!;
  if (pending.uid !== uid) {
    throw new HttpsError('permission-denied', 'El estado OAuth no corresponde a tu usuario');
  }

  const redirectUri = pending.redirectUri as string;

  try {
    const token = await exchangeTikTokCode(code.trim(), redirectUri);
    const accessToken = token.access_token;

    let displayName = '';
    try {
      const userInfo = await fetchTikTokUserInfo(accessToken);
      displayName = userInfo.display_name ?? '';
    } catch (e) {
      logger.info('TikTok user info no disponible', { uid, error: String(e) });
    }

    let creatorInfo: Awaited<ReturnType<typeof fetchTikTokCreatorInfo>> = {};
    try {
      creatorInfo = await fetchTikTokCreatorInfo(accessToken);
    } catch (e) {
      logger.info('TikTok creator info no disponible', { uid, error: String(e) });
    }

    const expiresAt = Date.now() + token.expires_in * 1000;
    const refreshExpiresAt = Date.now() + token.refresh_expires_in * 1000;

    await db.collection('tokens_redes').doc(uid).set(
      {
        tiktok: {
          accessToken,
          refreshToken: token.refresh_token,
          expiresAt,
          refreshExpiresAt,
          openId: token.open_id,
          scope: token.scope,
          displayName: displayName || creatorInfo.creator_nickname || '',
          username: creatorInfo.creator_username || '',
          actualizadoEn: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    await db.collection('canales').doc(uid).set(
      {
        usuarioId: uid,
        tiktok: {
          conectado: true,
          cuentaNombre: displayName || creatorInfo.creator_nickname || creatorInfo.creator_username || 'TikTok',
          integrationId: token.open_id,
          profileUrl: creatorInfo.creator_username ? `https://www.tiktok.com/@${creatorInfo.creator_username}` : null,
          proveedor: 'tiktok_oauth',
          verificadoPor: 'tiktok_oauth',
          verificadoEn: FieldValue.serverTimestamp(),
        },
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await pendingRef.delete();

    logger.info('TikTok OAuth connected', { uid, displayName });

    return {
      ok: true,
      cuentaNombre: displayName || creatorInfo.creator_nickname || creatorInfo.creator_username || 'TikTok',
      openId: token.open_id,
    };
  } catch (err) {
    logger.error('completeTikTokOAuth', err);
    throw new HttpsError(
      'internal',
      err instanceof Error ? err.message : 'No se pudo completar la conexión con TikTok'
    );
  }
});
