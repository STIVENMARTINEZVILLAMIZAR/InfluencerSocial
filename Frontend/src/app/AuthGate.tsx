import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { InfluencerSocialLogo } from './components/InfluencerSocialLogo';
import { useAuth } from '../context/AuthContext';
import { mensajeErrorAuth } from '../lib/authErrors';
import { hasRealFirebaseWebConfig, useAuthEmulator } from '../lib/firebase';
import App, { PublicLanding } from './App';

/** Login + app; invitados ven landing primero */
export default function AuthGate() {
  const { user, loginEmail, registerEmail, loginGoogle, logout, initError } = useAuth();
  const [guestView, setGuestView] = useState<'landing' | 'login'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    if (initError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="max-w-md bg-white border rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-600 mb-2">No se pudo preparar tu cuenta</p>
            <p className="text-sm text-slate-600 mb-4">{initError}</p>
            <button
              type="button"
              className="w-full py-2 rounded-xl border text-sm"
              onClick={() => void logout()}
            >
              Cerrar sesión e intentar de nuevo
            </button>
          </div>
        </div>
      );
    }
    return <App productionMode />;
  }

  if (guestView === 'landing') {
    return <PublicLanding onLogin={() => setGuestView('login')} />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const mail = email.trim();
      const pass = password;
      if (!mail || !pass) {
        setError('Correo y contraseña son obligatorios.');
        setLoading(false);
        return;
      }
      if (mode === 'login') await loginEmail(mail, pass);
      else await registerEmail(mail, pass);
    } catch (err) {
      setError(mensajeErrorAuth(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await loginGoogle();
    } catch (err) {
      setError(mensajeErrorAuth(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f0fdfa] dark:from-background dark:via-background dark:to-background/90 p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#06b6d4]/20 to-[#1e3a8a]/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-gradient-to-br from-[#2BBDE8]/20 to-[#0B1F4B]/20 blur-[100px]" style={{ animation: 'pulse 8s infinite alternate' }} />
      </div>

      <div className="w-full max-w-md bg-white/60 dark:bg-card/80 backdrop-blur-xl border border-white/60 dark:border-border/50 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10">
        <button
          type="button"
          onClick={() => setGuestView('landing')}
          className="absolute left-6 top-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[#06b6d4] transition-colors cursor-pointer"
          aria-label="Volver a inicio"
        >
          <ArrowLeft className="w-4 h-4" />
          Inicio
        </button>
        <div className="mb-8 mt-6 flex justify-center">
          <InfluencerSocialLogo size="lg" textClassName="!text-foreground !bg-none" />
        </div>
        <p className="text-sm font-medium text-center text-muted-foreground mb-8">Automatización de redes con IA y Make</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-4">
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-white/50 dark:bg-accent/30 border border-white/40 dark:border-border rounded-2xl text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4]/40 focus:bg-white dark:focus:bg-card focus:shadow-lg focus:shadow-[#06b6d4]/5 hover:bg-white/70 dark:hover:bg-accent/50 cursor-text"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/50 dark:bg-accent/30 border border-white/40 dark:border-border rounded-2xl text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/30 focus:border-[#06b6d4]/40 focus:bg-white dark:focus:bg-card focus:shadow-lg focus:shadow-[#06b6d4]/5 hover:bg-white/70 dark:hover:bg-accent/50 cursor-text"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium text-center bg-red-50 dark:bg-red-950/30 py-2 rounded-xl border border-red-100 dark:border-red-900/50">{error}</p>}
          {useAuthEmulator && (
            <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 text-xs text-emerald-900 dark:text-emerald-300 backdrop-blur-sm">
              Modo local: usa <strong>Crear cuenta</strong> o <strong>Entrar</strong> con correo/contraseña
              (emulador Auth en <code className="text-[11px] bg-emerald-100/50 dark:bg-emerald-900/50 px-1 rounded">127.0.0.1:9099</code>).
            </div>
          )}
          {!hasRealFirebaseWebConfig() && !useAuthEmulator && (
            <div className="rounded-2xl border border-[#06b6d4]/20 bg-[#06b6d4]/5 dark:bg-[#06b6d4]/10 px-4 py-3 text-xs text-[#0B1F4B] dark:text-[#06b6d4] backdrop-blur-sm">
              Para <strong>Continuar con Google</strong>, agrega en <code className="text-[11px] bg-white/50 px-1 rounded">Frontend/.env</code>{' '}
              las claves <code className="text-[11px] bg-white/50 px-1 rounded">VITE_FIREBASE_API_KEY</code> y{' '}
              <code className="text-[11px] bg-white/50 px-1 rounded">VITE_FIREBASE_APP_ID</code> desde Firebase Console, o ejecuta:{' '}
              <code className="text-[11px] bg-white/50 px-1 rounded">bash scripts/sync-firebase-web-env.sh</code>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-2xl relative overflow-hidden bg-gradient-to-r from-[#1e3a8a] to-[#06b6d4] text-white font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_15px_rgba(6,182,212,0.2)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_6px_20px_rgba(6,182,212,0.3)] hover:-translate-y-[1px] transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_15px_rgba(6,182,212,0.2)] cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando…' : mode === 'login' ? 'Entrar al Panel' : 'Crear mi cuenta'}
          </button>
        </form>
        <button
          type="button"
          disabled={loading || !hasRealFirebaseWebConfig()}
          onClick={() => void handleGoogle()}
          className="w-full mt-4 py-3 bg-white/50 dark:bg-accent/30 border border-white/60 dark:border-border/50 rounded-2xl text-sm font-medium hover:bg-white/80 dark:hover:bg-accent/50 transition-all duration-300 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          title={hasRealFirebaseWebConfig() ? undefined : 'Configura VITE_FIREBASE_API_KEY y APP_ID en Frontend/.env'}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>
        <button
          type="button"
          className="w-full mt-6 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-[#06b6d4] dark:from-[#60a5fa] dark:to-[#22d3ee] hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? '¿No tienes cuenta? Crear una' : 'Ya tengo cuenta, iniciar sesión'}
        </button>
        <p className="mt-8 text-center text-xs text-muted-foreground/80 font-medium">
          <a href="/privacidad" className="hover:text-[#06b6d4] transition-colors cursor-pointer">
            Política de privacidad
          </a>
        </p>
      </div>
    </div>
  );
}
