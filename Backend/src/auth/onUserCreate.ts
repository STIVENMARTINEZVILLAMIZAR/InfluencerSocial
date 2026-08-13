import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';

const CANAL_VACIO = { conectado: false, cuentaNombre: null };

/**
 * Al registrarse (correo o Google), crea en Firestore el motor de datos del usuario.
 */
export const onAuthUserCreate = functions
  .region('us-central1')
  .auth.user()
  .onCreate(async (user) => {
    const db = getFirestore();
    const uid = user.uid;
    const email = user.email ?? '';
    const nombre = user.displayName ?? email.split('@')[0] ?? 'Usuario';

    const usuarioRef = db.collection('usuarios').doc(uid);
    const canalesRef = db.collection('canales').doc(uid);
    const configRef = db.collection('configuracion').doc(uid);

    await usuarioRef.set(
      {
        uid,
        email,
        nombre,
        rol: 'editor',
        redesConectadas: {
          linkedin: false,
          instagram: false,
          facebook: false,
          twitter: false,
          tiktok: false,
        },
        creadoEn: FieldValue.serverTimestamp(),
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const canalesSnap = await canalesRef.get();
    if (!canalesSnap.exists) {
      await canalesRef.set({
        usuarioId: uid,
        linkedin: CANAL_VACIO,
        instagram: CANAL_VACIO,
        facebook: CANAL_VACIO,
        twitter: CANAL_VACIO,
        tiktok: CANAL_VACIO,
        creadoEn: FieldValue.serverTimestamp(),
        actualizadoEn: FieldValue.serverTimestamp(),
      });
    }

    const configSnap = await configRef.get();
    if (!configSnap.exists) {
      await configRef.set({
        usuarioId: uid,
        makeWebhookUrl: '',
        n8nWebhookUrl: '',
        notifications: true,
        timezone: 'America/Bogota',
        creadoEn: FieldValue.serverTimestamp(),
        actualizadoEn: FieldValue.serverTimestamp(),
      });
    }

    const actSnap = await db
      .collection('actividad')
      .where('usuarioId', '==', uid)
      .limit(1)
      .get();

    if (actSnap.empty) {
      await db.collection('actividad').add({
        usuarioId: uid,
        tipo: 'sistema',
        mensaje: 'Cuenta creada en InfluencerSocial. ¡Bienvenido!',
        red: 'linkedin',
        creadoEn: FieldValue.serverTimestamp(),
      });
    }

    logger.info('Usuario inicializado en Firestore', { uid, email });
  });
