# InfluencerSocial — Web

Aplicación principal de **InfluencerSocial**: automatización de publicaciones (foco LinkedIn), UI desde Figma + Firebase.

## Inicio rápido

```bash
npm install
cp .env.example .env
npm run dev
```

- `VITE_APP_MODE=production` — app real (sin barra de diseño de 8 pantallas)
- Completar `VITE_FIREBASE_*` del proyecto `campussocial-f56a0`

## Build

```bash
npm run build
```

Salida: `dist/` (servida por Firebase Hosting).

## Estructura relevante

- `src/lib/firebase.ts` — inicialización SDK
- `src/lib/db/` — acceso Firestore
- `src/context/AuthContext.tsx` — sesión
- `src/services/make.ts` — flujo publicación vía Cloud Function → webhook Make

Documentación del monorepo: [../README.md](../README.md)
