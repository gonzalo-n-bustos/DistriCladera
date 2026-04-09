import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { INITIAL_USERS } from '../constants';
import { getDefaultRouteForRole } from '../utils/views';

const Login: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Navegar cuando el usuario se autentique (a la ruta por defecto de su rol)
  useEffect(() => {
    if (isAuthenticated && user) {
      const defaultRoute = getDefaultRouteForRole(user.role);
      setTimeout(() => {
        navigate(defaultRoute, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) {
      setError('Por favor selecciona un usuario');
      return;
    }

    const user = INITIAL_USERS.find(u => u.id === selectedUserId);
    if (!user) {
      setError('Usuario no encontrado');
      return;
    }

    if (!user.status) {
      setError('Este usuario está inactivo');
      return;
    }

    try {
      login(selectedUserId);
      // La navegación se hará automáticamente cuando isAuthenticated cambie
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('Error al iniciar sesión. Por favor intenta de nuevo.');
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'Admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Vendedor':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'Logística':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'Facturación':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logo_color_solo_png.png"
                alt="Logo de Cladera Distribuidora"
                className="max-w-[200px] sm:max-w-[240px] w-full h-auto object-contain"
              />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Sistema de Seguimiento de Pedidos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Selecciona un usuario
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {INITIAL_USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setError('');
                    }}
                    disabled={!user.status}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedUserId === user.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    } ${!user.status ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="size-12 rounded-full bg-cover bg-center ring-2 ring-slate-200 dark:ring-slate-700"
                        style={{ backgroundImage: `url(${user.avatar})` }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          {!user.status && (
                            <span className="text-xs text-slate-400">(Inactivo)</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 border ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </div>
                      {selectedUserId === user.id && (
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedUserId}
              className="w-full px-4 py-3 rounded-lg bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
            Selecciona un usuario para acceder al sistema
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
