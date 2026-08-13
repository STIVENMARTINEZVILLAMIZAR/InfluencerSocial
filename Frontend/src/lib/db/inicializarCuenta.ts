import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebase';
import type { Usuario } from './types';
import { registrarActividad } from './actividad';

const CANAL_VACIO = { conectado: false, cuentaNombre: null };

/**
 * Crea el “motor” de datos del usuario: perfil, canales, configuración y actividad inicial.
 * Idempotente: no borra datos existentes.
 */
export async function inicializarCuentaUsuario(user: User): Promise<Usuario> {
  const uid = user.uid;
  const email = user.email ?? '';
  const nombre = user.displayName ?? email.split('@')[0] ?? 'Usuario';

  const usuarioRef = doc(db, 'usuarios', uid);
  const usuarioSnap = await getDoc(usuarioRef);

  const perfil: Usuario = {
    uid,
    email,
    nombre: (usuarioSnap.data()?.nombre as string) || nombre,
    rol: (usuarioSnap.data()?.rol as Usuario['rol']) || 'editor',
    redesConectadas: {
      linkedin: false,
      instagram: false,
      facebook: false,
      twitter: false,
      tiktok: false,
      ...(usuarioSnap.data()?.redesConectadas as object),
    },
    creadoEn: usuarioSnap.data()?.creadoEn,
    actualizadoEn: usuarioSnap.data()?.actualizadoEn,
  };

  await setDoc(
    usuarioRef,
    {
      ...perfil,
      actualizadoEn: serverTimestamp(),
      ...(usuarioSnap.exists() ? {} : { creadoEn: serverTimestamp() }),
    },
    { merge: true }
  );

  const canalesRef = doc(db, 'canales', uid);
  const canalesSnap = await getDoc(canalesRef);
  if (!canalesSnap.exists()) {
    await setDoc(canalesRef, {
      usuarioId: uid,
      linkedin: { ...CANAL_VACIO },
      instagram: { ...CANAL_VACIO },
      facebook: { ...CANAL_VACIO },
      twitter: { ...CANAL_VACIO },
      tiktok: { ...CANAL_VACIO },
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }

  const configRef = doc(db, 'configuracion', uid);
  const configSnap = await getDoc(configRef);
  if (!configSnap.exists()) {
    await setDoc(configRef, {
      usuarioId: uid,
      n8nWebhookUrl: '',
      notifications: true,
      timezone: 'America/Bogota',
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }

  const actSnap = await getDocs(
    query(collection(db, 'actividad'), where('usuarioId', '==', uid), limit(1))
  );
  if (actSnap.empty) {
    await registrarActividad(uid, {
      tipo: 'sistema',
      mensaje: 'Cuenta creada en InfluencerSocial. ¡Bienvenido!',
      red: 'linkedin',
    });
  }

  return perfil;
}
