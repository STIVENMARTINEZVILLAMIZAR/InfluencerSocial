import { randomBytes } from 'crypto';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  getAppFrontendUrl,
  getLinkedInClientId,
  getLinkedInClientSecret,
  getLinkedInRedirectUri,
  isLinkedInOAuthConfigured,
  LINKEDIN_AUTH_URL,
  LINKEDIN_DEFAULT_SCOPES,
  LINKEDIN_TOKEN_URL,
  LINKEDIN_USERINFO_URL,
} from './linkedinConfig';

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

type OAuthPending = {
  uid: string;
  red: string;
  creadoEn: FirebaseFirestore.Timestamp;
  expiraEn: FirebaseFirestore.Timestamp;
};

type LinkedInTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type LinkedInUserInfo = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

function redirectHtml(target: string, message: string): string {
  const safeTarget = target.replace(/"/g, '%22');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>InfluencerSocial</title></head>
<body><p>${message}</p><script>window.location.replace("${safeTarget}");</script>
<noscript><a href="${safeTarget}">Continuar</a></noscript></body></html>`;
}

/** Devuelve la URL de autorización LinkedIn (usuario autenticado en Firebase). */
export const linkedinOAuthStart = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }
  if (!isLinkedInOAuthConfigured()) {
    throw new HttpsError(
      'failed-precondition',
      'LinkedIn OAuth no configurado. Añade LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en Backend/.secret.local'
    );
  }

  const clientId = getLinkedInClientId()!;
  const state = randomBytes(24).toString('hex');
  const db = getFirestore();
  const now = Date.now();

  await db.collection('oauth_pendientes').doc(state).set({
    uid: request.auth.uid,
    red: 'linkedin',
    creadoEn: FieldValue.serverTimestamp(),
    expiraEn: Timestamp.fromMillis(now + OAUTH_STATE_TTL_MS),
  } satisfies Omit<OAuthPending, 'creadoEn'> & { creadoEn: FirebaseFirestore.FieldValue });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: getLinkedInRedirectUri(),
    state,
    scope: LINKEDIN_DEFAULT_SCOPES.join(' '),
  });

  return {
    url: `${LINKEDIN_AUTH_URL}?${params.toString()}`,
    state,
    redirectUri: getLinkedInRedirectUri(),
  };
});

/** Callback HTTP de LinkedIn → guarda tokens y redirige a la app. */
export const linkedinOAuthCallback = onRequest(
  { region: 'us-central1', cors: false },
  async (req, res) => {
    const frontend = getAppFrontendUrl();
    const fail = (code: string, detail?: string) => {
      const q = new URLSearchParams({ linkedin: code });
      if (detail) q.set('linkedin_error', detail.slice(0, 120));
      res
        .status(200)
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(redirectHtml(`${frontend}/?${q.toString()}`, 'Redirigiendo a InfluencerSocial…'));
    };

    const errorParam = typeof req.query.error === 'string' ? req.query.error : null;
    if (errorParam) {
      logger.warn('LinkedIn OAuth denied', errorParam);
      fail('denied', errorParam);
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code || !state) {
      fail('invalid');
      return;
    }

    if (!isLinkedInOAuthConfigured()) {
      fail('not_configured');
      return;
    }

    const db = getFirestore();
    const pendingRef = db.collection('oauth_pendientes').doc(state);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists) {
      fail('invalid_state');
      return;
    }

    const pending = pendingSnap.data() as OAuthPending;
    const expira = pending.expiraEn?.toMillis?.() ?? 0;
    if (expira < Date.now()) {
      await pendingRef.delete();
      fail('expired');
      return;
    }

    const uid = pending.uid;
    const redirectUri = getLinkedInRedirectUri();

    try {
      const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: getLinkedInClientId()!,
        client_secret: getLinkedInClientSecret()!,
      });

      const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.toString(),
      });

      const tokenJson = (await tokenRes.json()) as LinkedInTokenResponse;
      if (!tokenRes.ok || !tokenJson.access_token) {
        logger.error('LinkedIn token error', tokenRes.status, tokenJson);
        fail('token_error', tokenJson.error_description || tokenJson.error);
        return;
      }

      const profileRes = await fetch(LINKEDIN_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      const profile = (await profileRes.json()) as LinkedInUserInfo;
      if (!profileRes.ok) {
        logger.warn('LinkedIn userinfo failed', profileRes.status, profile);
      }

      const displayName =
        profile.name ||
        [profile.given_name, profile.family_name].filter(Boolean).join(' ') ||
        profile.email ||
        profile.sub ||
        'LinkedIn';

      const expiresAt = tokenJson.expires_in
        ? Timestamp.fromMillis(Date.now() + tokenJson.expires_in * 1000)
        : null;

      await db.collection('tokens_redes').doc(uid).set(
        {
          linkedin: {
            accessToken: tokenJson.access_token,
            refreshToken: tokenJson.refresh_token || null,
            expiresAt,
            scope: tokenJson.scope || LINKEDIN_DEFAULT_SCOPES.join(' '),
            linkedinSub: profile.sub || null,
            email: profile.email || null,
            name: displayName,
            picture: profile.picture || null,
          },
          actualizadoEn: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await db.collection('canales').doc(uid).set(
        {
          usuarioId: uid,
          linkedin: {
            conectado: true,
            cuentaNombre: displayName,
            profileUrl: null,
            proveedor: 'linkedin_oauth',
            verificadoPor: 'linkedin',
            verificadoEn: FieldValue.serverTimestamp(),
          },
          actualizadoEn: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await pendingRef.delete();

      res
        .status(200)
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(
          redirectHtml(
            `${frontend}/?linkedin=success`,
            'LinkedIn conectado. Redirigiendo…'
          )
        );
    } catch (e) {
      logger.error('linkedinOAuthCallback', e);
      fail('server_error');
    }
  }
);
