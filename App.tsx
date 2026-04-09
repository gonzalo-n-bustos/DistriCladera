
import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { AuditProvider } from './contexts/AuditContext';
import { ProductsProvider } from './contexts/ProductsContext';
import { ClientsProvider } from './contexts/ClientsContext';
import { UsersProvider } from './contexts/UsersContext';
import ProtectedRoute from './components/ProtectedRoute';
import ViewGuard from './components/ViewGuard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Products from './views/Products';
import Clients from './views/Clients';
import Orders from './views/Orders';
import OrderDetail from './views/OrderDetail';
import Users from './views/Users';
import Audit from './views/Audit';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const getTitle = () => {
    if (location.pathname.startsWith('/pedidos/')) {
      return 'Detalle del Pedido';
    }
    switch(location.pathname) {
      case '/': return 'Panel General';
      case '/productos': return 'Gestión de Productos';
      case '/clientes': return 'Administración de Clientes';
      case '/pedidos': return 'Pedidos Diarios';
      case '/usuarios': return 'Gestión de Usuarios';
      case '/auditoria': return 'Historial de Auditoría';
      default: return 'DistriCladera';
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark">
        <Header title={getTitle()} />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth no-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuditProvider>
        <ProductsProvider>
          <ClientsProvider>
            <UsersProvider>
              <OrdersProvider>
                <HashRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <ViewGuard>
                            <Layout>
                              <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/productos" element={<Products />} />
                              <Route path="/clientes" element={<Clients />} />
                              <Route path="/pedidos" element={<Orders />} />
                              <Route path="/pedidos/:id" element={<OrderDetail />} />
                              <Route path="/usuarios" element={<Users />} />
                              <Route path="/auditoria" element={<Audit />} />
                              </Routes>
                            </Layout>
                          </ViewGuard>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </HashRouter>
              </OrdersProvider>
            </UsersProvider>
          </ClientsProvider>
        </ProductsProvider>
      </AuditProvider>
    </AuthProvider>
  );
};

export default App;
