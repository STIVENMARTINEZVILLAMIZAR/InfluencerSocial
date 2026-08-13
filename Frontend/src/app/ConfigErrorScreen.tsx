/** Pantalla visible si Firebase no está configurado en el build de producción. */
export function ConfigErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-2">InfluencerSocial</h1>
        <p className="text-sm text-slate-600 mb-4">
          Falta la configuración de Firebase en este despliegue. La app no puede iniciar sesión ni cargar datos.
        </p>
        <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5 mb-4">
          <li>
            En Vercel: <strong>Settings → Environment Variables</strong> con{' '}
            <code className="text-xs">VITE_FIREBASE_API_KEY</code> y{' '}
            <code className="text-xs">VITE_FIREBASE_APP_ID</code>
          </li>
          <li>
            O incluye <code className="text-xs">Frontend/.env.production</code> y vuelve a desplegar
          </li>
          <li>
            En Firebase Auth: dominio autorizado <code className="text-xs">campus-social-indol.vercel.app</code>
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          Tras cambiar variables, haz <strong>Redeploy</strong> en Vercel (el build debe repetirse).
        </p>
      </div>
    </div>
  );
}
