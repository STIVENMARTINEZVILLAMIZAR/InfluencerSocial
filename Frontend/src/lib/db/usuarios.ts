import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebase';
import type { Usuario } from './types';

const CANAL_VACIO = { conectado: false, cuentaNombre: null };

export async function inicializarCuentaUsuario(authUser: User): Promise<Usuario> {
  const uid = authUser.uid;
  const email = authUser.email ?? '';
  const nombre = authUser.displayName ?? email.split('@')[0] ?? 'Usuario';

  const usuarioRef = doc(db, 'usuarios', uid);
  const snap = await getDoc(usuarioRef);

  const base: Usuario = {
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
  };

  if (!snap.exists()) {
    await setDoc(usuarioRef, {
      ...base,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  } else {
    await setDoc(usuarioRef, { ...base, actualizadoEn: serverTimestamp() }, { merge: true });
  }

  const canalesRef = doc(db, 'canales', uid);
  const canalesSnap = await getDoc(canalesRef);
  if (!canalesSnap.exists()) {
    await setDoc(canalesRef, {
      usuarioId: uid,
      linkedin: CANAL_VACIO,
      instagram: CANAL_VACIO,
      facebook: CANAL_VACIO,
      twitter: CANAL_VACIO,
      tiktok: CANAL_VACIO,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }

  const configRef = doc(db, 'configuracion', uid);
  const configSnap = await getDoc(configRef);
  if (!configSnap.exists()) {
    await setDoc(configRef, {
      usuarioId: uid,
      makeWebhookUrl: '',
      n8nWebhookUrl: '',
      notifications: true,
      timezone: 'America/Bogota',
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }

  const actQ = query(collection(db, 'actividad'), where('usuarioId', '==', uid), limit(1));
  const actSnap = await getDocs(actQ);
  if (actSnap.empty) {
    await addDoc(collection(db, 'actividad'), {
      usuarioId: uid,
      tipo: 'sistema',
      mensaje: 'Cuenta lista en InfluencerSocial. ¡Bienvenido!',
      red: 'linkedin',
      creadoEn: serverTimestamp(),
    });
  }

  const updated = await getDoc(usuarioRef);
  return { ...(updated.data() as Usuario), uid };
}
