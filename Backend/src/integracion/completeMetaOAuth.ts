import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  exchangeMetaCode,
  exchangeMetaLongLivedToken,
  fetchMetaPages,
  type MetaPageInfo,
} from './metaOAuthApi';

function pickFacebookPage(pages: MetaPageInfo[]): MetaPageInfo | null {
  return pages.find((p) => p.accessToken) ?? pages[0] ?? null;
}

function pickInstagramAccount(pages: MetaPageInfo[]): MetaPageInfo | null {
  return pages.find((p) => p.igId) ?? null;
}

export const completeMetaOAuth = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { code, state } = request.data as { code?: string; state?: string };
  if (!code?.trim() || !state?.trim()) {
    throw new HttpsError('invalid-argument', 'code y state son obligatorios');
  }

  const uid = request.auth.uid;
  const db = getFirestore();
  const pendingRef = db.collection('oauth_meta_pending').doc(state.trim());
  const pendingSnap = await pendingRef.get();

  if (!pendingSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'Sesión OAuth expirada o inválida. Vuelve a Canales → Conectar Facebook/Instagram e inicia el flujo de nuevo (no recargues esta página).'
    );
  }

  const pending = pendingSnap.data()!;
  if (pending.uid !== uid) {
    throw new HttpsError('permission-denied', 'El estado OAuth no corresponde a tu usuario');
  }

  const redirectUri = pending.redirectUri as string;
  const provider = pending.provider === 'instagram' ? 'instagram' : 'facebook';

  try {
    const shortToken = await exchangeMetaCode(code.trim(), redirectUri, provider);
    const longLived = await exchangeMetaLongLivedToken(shortToken.access_token, provider);
    const accessToken = longLived.access_token || shortToken.access_token;
    const pages = await fetchMetaPages(accessToken);

    if (pages.length === 0) {
      throw new Error(
        'No se encontraron páginas de Facebook en tu cuenta. Crea una página en business.facebook.com o verifica los permisos de la app Meta.'
      );
    }

    const expiresAt = Date.now() + (longLived.expires_in ?? shortToken.expires_in ?? 5184000) * 1000;

    await db.collection('tokens_redes').doc(uid).set(
      {
        meta: {
          accessToken,
          expiresAt,
          pages,
          actualizadoEn: FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    const fbPage = pickFacebookPage(pages);
    if (fbPage) {
      await db.collection('canales').doc(uid).set(
        {
          usuarioId: uid,
          facebook: {
            conectado: true,
            cuentaNombre: fbPage.name,
            integrationId: fbPage.id,
            proveedor: 'meta_oauth',
            verificadoPor: 'meta_oauth',
            verificadoEn: FieldValue.serverTimestamp(),
          },
          actualizadoEn: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const ig = pickInstagramAccount(pages);
    const instagramConectado = Boolean(ig);
    await db.collection('canales').doc(uid).set(
      {
        usuarioId: uid,
        instagram: {
          conectado: instagramConectado,
          cuentaNombre: ig?.igUsername ?? null,
          integrationId: ig?.igId ?? null,
          proveedor: 'meta_oauth',
          verificadoPor: 'meta_oauth',
          verificadoEn: FieldValue.serverTimestamp(),
        },
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await pendingRef.delete();

    logger.info('Meta OAuth connected', { uid, pages: pages.length, instagramConectado });

    return {
      ok: true,
      facebook: fbPage ? { id: fbPage.id, nombre: fbPage.name } : null,
      instagram: ig
        ? { id: ig.igId, nombre: ig.igUsername, pagina: ig.name }
        : null,
      avisoInstagram: instagramConectado
        ? undefined
        : 'Facebook conectado. Para Instagram: vincula una cuenta Instagram Business a una de tus páginas de Facebook.',
    };
  } catch (err) {
    logger.error('completeMetaOAuth', err);
    throw new HttpsError(
      'internal',
      err instanceof Error ? err.message : 'No se pudo completar la conexión con Meta'
    );
  }
});