import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const touchTarget = 'min-w-[44px] min-h-[44px]';

  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
    document.body.style.overflow = '';
    return undefined;
  }, [isOpen, onClose]);

  const navItems = [
    { name: 'Panel General', icon: 'dashboard', path: '/' },
    { name: 'Productos', icon: 'inventory_2', path: '/productos' },
    { name: 'Clientes', icon: 'group', path: '/clientes' },
    { name: 'Pedidos', icon: 'shopping_cart', path: '/pedidos' },
    { name: 'Usuarios', icon: 'manage_accounts', path: '/usuarios' },
    { name: 'Auditoría', icon: 'fact_check', path: '/auditoria' },
  ];

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
      onClose?.();
    }
  };

  const handleNavClick = () => onClose?.();

  const sidebarContent = (
    <div className="flex flex-col h-full p-4 justify-between">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 flex items-center justify-center rounded-lg size-10">
            <span className="material-symbols-outlined text-primary fill">local_shipping</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">DistriCladera</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Administración</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group min-h-[44px] ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 lg:hover:bg-slate-100 lg:dark:hover:bg-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined transition-colors group-hover:${isActive ? '' : 'text-primary'}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        {/* Sección inferior: modo oscuro, configuración, cerrar sesión */}
        <div className="px-2 py-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <button
            onClick={() => document.documentElement.classList.toggle('dark')}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors ${touchTarget}`}
            aria-label="Modo oscuro"
          >
            <span className="material-symbols-outlined">dark_mode</span>
            <span className="text-sm font-medium">Modo oscuro</span>
          </button>
          <button
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors ${touchTarget}`}
            aria-label="Configuración"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Configuración</span>
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors ${touchTarget}`}
              aria-label="Cerrar sesión"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          )}
        </div>

        <div className="px-2 py-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="size-9 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 flex-shrink-0"
              style={{
                backgroundImage: user?.avatar
                  ? `url("${user.avatar}")`
                  : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrprRuyoRqWKijO9YLnmZ8yNmz8EuDrlMAKCBMT3bJyak1YQo0vt5ayS-aQ70xZLidOtbwQbAhkTWd2gun7sC-m933JC2u56v97RZwieGtDH4qDDN30BBFVrsjHlRlM0lusRUhOl9F1LB3OmpkNAQypyvn6e7P1TVQKAbuWpA5E9GgOEy5xhrD1XT8s1vccaySv5vE864EyZ5VjH4a7q-SOKdq9BQnbcJZ2DNaHHl_Pcn3jD66pf5KNFnbQsI3sVZ83RwoU-hGIsaK")'
              }}
            />
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || 'Usuario'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sidebar fijo visible desde lg (1024px) */}
      <aside className="hidden lg:flex w-72 flex-col bg-white dark:bg-[#1a2634] border-r border-slate-200 dark:border-slate-800 h-full flex-shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile: backdrop + drawer deslizable */}
      <div className="lg:hidden">
        <div
          role="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
          className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 min-w-[44px] min-h-[44px] ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
        <aside
          className={`fixed inset-y-0 left-0 w-72 flex flex-col bg-white dark:bg-[#1a2634] border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 ease-out shadow-xl ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!isOpen}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
