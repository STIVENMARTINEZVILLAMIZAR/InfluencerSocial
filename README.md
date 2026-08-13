# InfluencerSocial

Automatización de publicaciones en redes sociales con IA, con foco en **LinkedIn** (Postiz + **Make**) e **Asistente IA** (Gemini) como un apartado más de la app.

## Estructura

| Carpeta | Rol |
|---------|-----|
| **`Frontend/`** | App React InfluencerSocial (UI + Firebase cliente) |
| **`Backend/`** | Cloud Functions (IA, posts, Make, LinkedIn) |
| **`docs/`** | Documentación (Firestore, arquitectura, módulo IA) |
| **`legacy/flask-backend/`** | Flask antiguo (no producción) |

> **Nota:** `Fontend` tiene un typo (falta la *r*). Conviene renombrar a `frontend` cuando puedas; mientras tanto Firebase y la documentación usan `Fontend/`.

## Requisito: Node.js 20+

El sistema puede traer Node 12 por defecto (`/usr/bin/node`). InfluencerSocial necesita **Node ≥ 20** (Vite 6, Firebase 11).

```bash
# Si instalaste nvm (una vez)::
source ~/.bashrc
nvm use          # lee .nvmrc → Node 20
bash scripts/ensure-node.sh
```

## Desarrollo local

**Terminal 1 — Backend (emuladores, dejar abierta):**

```bash
cd Backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd Frontend
npm install
# En .env: VITE_USE_FIREBASE_EMULATOR=true y credenciales Firebase
npm run dev
```

> `npm run build` en Backend **solo compila**; no inicia el servidor. Ver [Backend/README.md](Backend/README.md).

## Firebase (`campussocial-f56a0`)

- **Hosting en vivo:** https://campussocial-f56a0.web.app · Privacidad: `/privacidad`
- **Cloud Functions** requieren plan **Blaze** (ver [docs/DEPLOY_FIREBASE.md](docs/DEPLOY_FIREBASE.md))

```bash
# Sin Blaze (app + reglas Firestore):
firebase deploy --only hosting,firestore

# Con Blaze (backend completo):
firebase deploy --only hosting,functions,firestore
```

- Hosting → `Frontend/dist`
- Functions → `Backend/`

## Automatización (n8n local con Docker)

El workflow está en `Flujo_Automatizacion/`:

```powershell
cd Flujo_Automatizacion
docker compose up -d
```

1. Guía: [docs/N8N_DOCKER.md](docs/N8N_DOCKER.md) · Checklist: [Flujo_Automatizacion/CHECKLIST.md](Flujo_Automatizacion/CHECKLIST.md)
2. Importar `InfluencerSocial _ Publicación LinkedIn.json` en http://localhost:5678
3. Con ngrok: `ngrok http 5678` → `N8N_WEBHOOK_URL=https://xxx.ngrok-free.dev/webhook/campus-post-form`
4. App → **Ajustes** → misma URL · **Asistente IA** → **Generar publicación** abre Nueva publicación automáticamente

Alternativa en la nube (sin Docker): [docs/MAKE_SETUP.md](docs/MAKE_SETUP.md)

## Documentación

- [docs/N8N_DOCKER.md](docs/N8N_DOCKER.md) — n8n local con Docker
- [docs/MAKE_SETUP.md](docs/MAKE_SETUP.md) — alternativa Make (nube)
- [STRUCTURA_PROYECTO.md](STRUCTURA_PROYECTO.md)
- [docs/ARQUITECTURA_FIREBASE.md](docs/ARQUITECTURA_FIREBASE.md)
- [docs/MODULO_ASISTENTE_IA.md](docs/MODULO_ASISTENTE_IA.md) — apartado IA (no carpeta `modules/`)
