import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../contexts/OrdersContext';
import { useClients } from '../contexts/ClientsContext';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuToggle, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(value.trim().length > 0);
  };

  // Buscar en pedidos y clientes
  const searchResults = React.useMemo(() => {
    if (!searchTerm.trim()) return { orders: [], clients: [] };
    
    const term = searchTerm.toLowerCase();
    const matchingOrders = orders
      .filter(order => 
        order.id.toLowerCase().includes(term) || 
        order.client.toLowerCase().includes(term)
      )
      .slice(0, 5);
    
    const matchingClients = clients
      .filter(client => 
        client.id.toLowerCase().includes(term) || 
        client.name.toLowerCase().includes(term)
      )
      .slice(0, 5);
    
    return { orders: matchingOrders, clients: matchingClients };
  }, [searchTerm, orders, clients]);

  const handleResultClick = (type: 'order' | 'client', id: string) => {
    if (type === 'order') {
      const orderId = id.replace('#', '');
      navigate(`/pedidos/${orderId}`);
    } else {
      navigate('/clientes');
    }
    setSearchTerm('');
    setShowResults(false);
  };

  const touchTarget = 'min-w-[44px] min-h-[44px]'; // Accesibilidad: área táctil mínima 44px

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a2634] px-4 lg:px-8 py-4 sticky top-0 z-10 transition-colors">
      {/* Mobile: hamburguesa | título centrado | notificaciones */}
      <div className="flex lg:hidden items-center justify-between w-full gap-3">
        <button
          onClick={onMenuToggle}
          className={`flex items-center justify-center rounded-lg size-11 text-slate-500 active:bg-slate-200 dark:active:bg-slate-700 dark:text-slate-400 transition-colors ${touchTarget}`}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
        </button>
        <h2 className="flex-1 text-center text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight truncate">
          {title}
        </h2>
        <button
          className={`flex items-center justify-center rounded-lg size-11 text-slate-500 active:bg-slate-200 dark:active:bg-slate-700 dark:text-slate-400 transition-colors relative ${touchTarget}`}
          aria-label="Notificaciones"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-3 right-3 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a2634]"></span>
        </button>
      </div>

      {/* Desktop: título | búsqueda | 4 botones */}
      <div className="hidden lg:flex items-center gap-4 flex-1">
        <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
          {title}
        </h2>
      </div>

      <div className="hidden lg:flex items-center gap-6">
        <div className="flex flex-col min-w-64 h-10 relative">
          <div className="flex w-full flex-1 items-stretch rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <div className="text-slate-400 flex items-center justify-center pl-3">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
            </div>
            <input
              className="flex w-full min-w-0 flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 text-sm px-3"
              placeholder="Buscar pedidos, clientes..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={() => searchTerm.trim() && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
          </div>
          {showResults && (searchResults.orders.length > 0 || searchResults.clients.length > 0) && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#1a2634] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {searchResults.orders.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-2 py-1">Pedidos</div>
                  {searchResults.orders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => handleResultClick('order', order.id)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{order.id}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{order.client}</div>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.clients.length > 0 && (
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase px-2 py-1">Clientes</div>
                  {searchResults.clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleResultClick('client', client.id)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{client.id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-6">
          <button
            className={`flex items-center justify-center rounded-lg size-11 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors relative ${touchTarget}`}
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a2634]"></span>
          </button>
          <button
            onClick={() => document.documentElement.classList.toggle('dark')}
            className={`flex items-center justify-center rounded-lg size-11 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors ${touchTarget}`}
            aria-label="Modo oscuro"
          >
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <button
            className={`flex items-center justify-center rounded-lg size-11 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors ${touchTarget}`}
            aria-label="Configuración"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center rounded-lg size-11 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors ${touchTarget}`}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
