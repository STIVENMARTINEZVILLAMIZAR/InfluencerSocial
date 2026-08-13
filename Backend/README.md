# InfluencerSocial — Backend (Cloud Functions)

Este backend **no es un servidor** tipo Flask que queda escuchando con `npm run build`.

| Comando | Qué hace |
|---------|----------|
| `npm run build` | Solo compila TypeScript → carpeta `lib/` y **termina** |
| `npm run dev` o `npm start` | Compila **y levanta** emuladores Firebase (backend real en local) |

## Arrancar el backend (local)

**Requisitos:**
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)
- **JDK 21+** para emuladores Firestore/Storage (Firebase ya no admite Java 17)

```bash
# Sin sudo (descarga Temurin a ~/jdk/jdk-21):
bash scripts/install-jdk21-user.sh

# O con apt:
sudo apt-get install -y openjdk-21-jdk
```

```powershell
cd Backend
npm install
npm run dev
```

En Windows no hace falta WSL/bash: `npm run dev` usa `run-dev.cjs` y llama a Firebase directamente.

Deja esa terminal **abierta**. Cuando veas `All emulators ready!`, el backend está activo.

- Functions (IA, posts, n8n): `http://127.0.0.1:5001`
- Consola web: `http://127.0.0.1:4000`

### API de IA (Gemini / Claude)

**Un solo archivo de secretos:** `Backend/.secret.local` (no crear otro en la raíz del proyecto).

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...   # https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.0-flash
```

- **No uses** `VITE_FIREBASE_API_KEY` del Frontend: es otra clave y da 403.
- Si ves **403 "leaked"**: Google bloqueó la clave por exponerla; crea una **nueva** en AI Studio.
- **gemini-2.5-flash** funciona con clave nueva; si hay cuota (429), prueba `gemini-2.0-flash-lite`.

Copia desde `Backend/.secret.local.example`.

### LinkedIn OAuth (conectar cuenta sin Postiz)

```env
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

Guía completa: [docs/LINKEDIN_OAUTH.md](../docs/LINKEDIN_OAUTH.md). Redirect local: `http://localhost:5173/oauth/linkedin`.

### Meta OAuth (Facebook + Instagram sin Postiz)

Una sola app en [Meta for Developers](https://developers.facebook.com/apps) conecta ambos canales.

```env
META_CLIENT_ID=...      # App ID
META_CLIENT_SECRET=...  # App Secret
```

Redirect local: `http://localhost:5173/oauth/meta` (regístrala en Configuración → Avanzado → URI de redireccionamiento de OAuth válidos). Permisos pedidos: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `business_management`, `instagram_basic`, `instagram_content_publish` (puedes limitarlos con `META_OAUTH_SCOPES`).

- **Facebook:** publica en la primera página del usuario (`/{page-id}/feed` o `/photos`).
- **Instagram:** publica en la cuenta Instagram Business vinculada a una página (flujo container → `media_publish`). Requiere imagen o video.
- La app Meta debe estar en modo Live con revisión si vas a publicar para terceros; para tu propia cuenta personal de administrador de la app suele bastar el modo Development.

## Conectar el Frontend

En `Frontend/.env`:

```env
VITE_USE_FIREBASE_EMULATOR=true
```

Luego en otra terminal:

```powershell
cd Frontend
npm run dev
```

## Errores frecuentes

### "Port 8080 is not open" / "port taken"

Otro proceso (suele ser `java.exe` del emulador anterior) ya usa el puerto **8080**.

**Opción A — liberar puertos y arrancar de nuevo:**

```powershell
cd Backend
npm run dev:kill
npm run dev
```

**Opción B — manual:**

1. Cierra la terminal vieja con `npm run dev` (Ctrl+C), o
2. En PowerShell: `taskkill /PID <número> /F` (el PID lo ves con `netstat -ano | findstr :8080`)

Luego **solo una** terminal con `npm run dev` hasta ver `All emulators ready!`.

Si el puerto sigue ocupado pero los emuladores **ya están corriendo** en otra terminal, no ejecutes `npm run dev` otra vez: usa esa instancia y abre http://127.0.0.1:4000

### `npm run build` y vuelve al prompt

Es normal: solo compila. Usa **`npm run dev`**.

### Aviso Node 20 vs 25

`engines: { "node": "20" }` es para Firebase en la nube. En tu PC, Node 22/25 suele funcionar; el aviso `EBADENGINE` no impide el emulador.

## Producción (nube)

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
npm run build
cd ..
firebase deploy --only functions
```
