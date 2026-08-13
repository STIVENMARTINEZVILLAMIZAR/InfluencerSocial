import type { Timestamp } from 'firebase/firestore';

export type RedSocial =
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'tiktok'
  | 'freelancer'
  | 'fiverr';

export type EstadoPublicacion =
  | 'borrador'
  | 'programado'
  | 'publicado'
  | 'fallido'
  | 'pendiente'
  | 'en_proceso';

export type EstadoBorrador = 'pendiente' | 'aprobado' | 'rechazado' | 'programado';

export type Usuario = {
  uid: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'editor' | 'viewer';
  redesConectadas?: Partial<Record<RedSocial, boolean>>;
  creadoEn?: Timestamp;
  actualizadoEn?: Timestamp;
};

export type CanalRed = {
  conectado: boolean;
  cuentaNombre: string | null;
  integrationId?: string | null;
  profileUrl?: string | null;
  proveedor?: string;
  verificadoPor?: string;
  verificadoEn?: Timestamp;
};

export type CanalesDoc = {
  usuarioId: string;
  linkedin?: CanalRed;
  instagram?: CanalRed;
  facebook?: CanalRed;
  twitter?: CanalRed;
  tiktok?: CanalRed;
  freelancer?: CanalRed;
  fiverr?: CanalRed;
  actualizadoEn?: Timestamp;
};

export type Publicacion = {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string | null;
  redesDestino: RedSocial[];
  estado: EstadoPublicacion;
  fechaProgramada?: Timestamp | null;
  creadoPor: string;
  resultados?: Record<string, { success: boolean; postId?: string; error?: string }>;
  n8nExecutionId?: string | null;
  creadoEn?: Timestamp;
  actualizadoEn?: Timestamp;
};

export type Borrador = {
  id: string;
  usuarioId: string;
  titulo: string;
  contenidoGenerado: string;
  hashtags?: string[];
  promptOriginal: string;
  tono: string;
  redSocial?: string;
  redesDestino: RedSocial[];
  imagenUrl?: string | null;
  imagenConIa?: boolean;
  estado: EstadoBorrador;
  n8nExecutionId?: string | null;
  programadoPara?: Timestamp | null;
  creadoEn?: Timestamp;
  actualizadoEn?: Timestamp;
};

export type ActividadItem = {
  id: string;
  usuarioId: string;
  tipo: 'publicado' | 'programado' | 'borrador' | 'error' | 'sistema';
  mensaje: string;
  red?: RedSocial | string;
  creadoEn?: Timestamp;
};

export type ChatMensaje = {
  id: string;
  role: 'user' | 'model';
  content: string;
  accionSugerida?: string | null;
  temaSugerido?: string | null;
  tonoSugerido?: string | null;
  orden?: number;
  creadoEn?: Timestamp;
};

export type Configuracion = {
  usuarioId: string;
  n8nWebhookUrl?: string;
  makeWebhookUrl?: string;
  notifications?: boolean;
  timezone?: string;
  creadoEn?: Timestamp;
  actualizadoEn?: Timestamp;
};

export type AutomationPostPayload = {
  topic: string;
  tone: string;
  include_image?: boolean;
  telegram_notify?: boolean;
  schedule_now?: boolean;
  platforms: string[];
  body?: string;
  image_url?: string | null;
  action?: 'publish' | 'verify_channel' | 'notify_scheduled';
  title?: string;
  campus_published?: boolean;
  provider?: string;
  post_id?: string;
  scheduled_at?: string;
};

export type AutomationPostResponse = {
  success?: boolean;
  message?: string;
  draft?: boolean;
  [key: string]: unknown;
};
