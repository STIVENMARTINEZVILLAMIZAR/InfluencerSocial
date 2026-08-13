export type RedSocial =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'freelancer'
  | 'fiverr';

export type EstadoPublicacion = 'borrador' | 'programado' | 'publicado' | 'fallido';

export interface ResultadoRed {
  success: boolean;
  postId?: string;
  error?: string;
}

export interface Publicacion {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
  redesDestino: RedSocial[];
  estado: EstadoPublicacion;
  fechaProgramada: FirebaseFirestore.Timestamp | null;
  creadoPor: string;
  resultados?: Partial<Record<RedSocial, ResultadoRed>>;
  creadoEn: FirebaseFirestore.Timestamp;
  actualizadoEn: FirebaseFirestore.Timestamp;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GenerateContentRequest {
  prompt: string;
  redSocial: string;
  tono: string;
}

export interface GenerateContentResponse {
  contenido: string;
  hashtags: string[];
  variaciones: string[];
  provider?: string;
  imagenGenerada?: boolean;
  imagenUrl?: string;
  imagenNota?: string;
}
