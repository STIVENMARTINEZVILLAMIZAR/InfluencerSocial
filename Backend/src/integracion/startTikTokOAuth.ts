import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';
import {
  getTikTokClientKey,
  getTikTokClientSecret,
  getTikTokOAuthScopes,
  TIKTOK_AUTH_URL,
} from './tiktokOAuthConfig';

function normalizeRedirectUri(uri: string): string {
  const trimmed = uri.trim();
  try {
    const url = new URL(trimmed);
    let path = url.pathname.replace(/\/+$/, '');
    if (!path || path === '/') path = '/oauth/tiktok';
    return `${url.protocol}//${url.host}${path}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export const startTikTokOAuth = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { redirectUri } = request.data as { redirectUri?: string };
  const redirect = normalizeRedirectUri(redirectUri ?? '');
  if (!redirect || !/^https?:\/\//i.test(redirect)) {
    throw new HttpsError('invalid-argument', 'redirectUri inválida');
  }

  let clientKey: string;
  try {
    clientKey = getTikTokClientKey();
    getTikTokClientSecret();
  } catch (e) {
    throw new HttpsError(
      'failed-precondition',
      e instanceof Error ? e.message : 'TikTok OAuth no configurado en el servidor'
    );
  }

  const state = randomBytes(24).toString('hex');
  const uid = request.auth.uid;
  const db = getFirestore();

  await db.collection('oauth_tiktok_pending').doc(state).set({
    uid,
    redirectUri: redirect,
    creadoEn: FieldValue.serverTimestamp(),
  });

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    scope: getTikTokOAuthScopes(),
    redirect_uri: redirect,
    state,
  });

  const authUrl = `${TIKTOK_AUTH_URL}?${params.toString()}`;

  return { authUrl, state };
});
