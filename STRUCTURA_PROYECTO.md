# InfluencerSocial — Estructura del proyecto

**Producto:** InfluencerSocial (automatización de publicaciones, LinkedIn primero).  
**Asistente IA:** pantalla y código en `Backend/src/ai/`, no un repo ni carpeta raíz aparte.

---

## Árbol actual

```
InfluencerSocial/
├── Fontend/              ★ App React (todas las pantallas)
│   └── src/lib/          ★ Firebase + repos Firestore
├── Backend/              ★ Cloud Functions
│   └── src/ai/           ★ Lógica Asistente IA
├── docs/
├── legacy/flask-backend/
├── firebase.json         → Hosting: Fontend/dist · Functions: Backend
└── README.md
```

**No usar:** `web/`, `functions/`, `agente_inteligente/`, `modules/agente-ia/` (obsoletos o eliminados).

---

## `Fontend/`

- `src/app/App.tsx` — UI Figma (dashboard, nueva pub, borradores, calendario, asistente IA, canales, ajustes)
- `src/lib/firebase.ts` — SDK
- `src/lib/db/` — Firestore
- `.env` — `VITE_APP_MODE=production`, `VITE_FIREBASE_*`

---

## `Backend/`

Cloud Functions de **todo** InfluencerSocial:

| Carpeta | Funciones |
|---------|-----------|
| `src/ai/` | `generateContent`, `chatWithAgent` |
| `src/posts/` | `schedulePost`, `publishPostNow`, `scheduledPublisher` |
| `src/integracion/` | `triggerN8nWorkflow` |
| `src/social/` | LinkedIn, etc. |

---

## `modules/agente-ia/`

**Eliminada.** Solo tenía un README; el código nunca vivió ahí. Ver [docs/MODULO_ASISTENTE_IA.md](docs/MODULO_ASISTENTE_IA.md).

---

## Comandos

```bash
cd Frontend && npm run dev
cd Backend && npm run build
firebase deploy --only firestore,functions,hosting
```
