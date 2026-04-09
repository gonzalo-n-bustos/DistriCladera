import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../contexts/OrdersContext';
import { usePermissions } from '../hooks/usePermissions';
import { OrderStatus, Order } from '../types.ts';
import NewOrderModal from '../components/NewOrderModal';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orders, hasUnweighedKGProducts } = useOrders();
  const { canCreateOrder } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenuOrder, setContextMenuOrder] = useState<{ order: Order; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Calcular estadísticas dinámicamente basadas en todos los pedidos
  const stats = useMemo(() => [
    { 
      title: 'Pendiente de Armado', 
      value: orders.filter(o => o.status === OrderStatus.PENDIENTE_ARMADO).length,
      label: 'Pedidos en cola', 
      icon: 'package_2', 
      color: 'orange' 
    },
    { 
      title: 'Pendiente Facturación', 
      value: orders.filter(o => o.status === OrderStatus.PENDIENTE_FACTURACION).length,
      label: 'Requieren atención', 
      icon: 'description', 
      color: 'blue' 
    },
    { 
      title: 'Facturados', 
      value: orders.filter(o => o.status === OrderStatus.FACTURADO).length,
      label: 'Completados', 
      icon: 'check_circle', 
      color: 'emerald', 
      trending: true 
    },
    { 
      title: 'Entregados', 
      value: orders.filter(o => o.status === OrderStatus.ENTREGADO).length,
      label: 'Completados', 
      icon: 'local_shipping', 
      color: 'teal', 
      trending: true 
    },
  ], [orders]);

  const handleContextMenu = (e: React.MouseEvent, order: Order) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuOrder({
      order,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMenuAction = (action: 'view' | 'edit' | 'delete', order: Order) => {
    setContextMenuOrder(null);
    
    if (action === 'view') {
      const id = order.id.replace('#', '');
      navigate(`/pedidos/${id}`);
    } else if (action === 'edit') {
      // Navegar a la página de pedidos con el pedido seleccionado
      navigate('/pedidos');
      // Aquí se podría pasar el ID como estado o query param para abrir el modal de edición
    } else if (action === 'delete') {
      if (window.confirm(`¿Estás seguro de que deseas eliminar el pedido ${order.id}?\n\nCliente: ${order.client}\nEsta acción no se puede deshacer.`)) {
        // La eliminación se manejaría desde Orders.tsx
        navigate('/pedidos');
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenuOrder(null);
      }
    };

    if (contextMenuOrder) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenuOrder]);

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Resumen de hoy</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Aquí tienes el estado actual de los pedidos diarios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-[#1a2634] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute right-0 top-0 p-6 opacity-[0.12] dark:opacity-[0.15] group-hover:opacity-[0.18] dark:group-hover:opacity-[0.25] transition-opacity">
              <span 
                className="material-symbols-outlined fill"
                style={{ 
                  fontSize: '96px', 
                  color: stat.color === 'orange' ? '#f97316' : 
                         stat.color === 'emerald' ? '#10b981' : 
                         stat.color === 'teal' ? '#14b8a6' : 
                         '#3b82f6'
                }}
              >
                {stat.icon === 'package_2' ? 'inventory_2' : stat.icon === 'description' ? 'receipt_long' : stat.icon}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                stat.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 
                stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 
                stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
              }`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.title}</p>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white text-4xl font-bold tracking-tight">{stat.value}</p>
              <p className={`${stat.trending ? (stat.color === 'teal' ? 'text-teal-600 dark:text-teal-400' : 'text-emerald-600 dark:text-emerald-400') + ' flex items-center gap-1' : 'text-slate-400 dark:text-slate-500'} text-sm mt-1`}>
                {stat.trending && <span className="material-symbols-outlined text-[16px]">trending_up</span>}
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1a2634] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col">
          <h4 className="text-slate-900 dark:text-white font-bold text-lg">Acciones Rápidas</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona los pedidos entrantes.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/pedidos')}
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 gap-2 text-sm font-bold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
            <span className="whitespace-nowrap">Ver Pedidos del Día</span>
          </button>
          {canCreateOrder() && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary text-white hover:bg-primary-hover gap-2 text-sm font-bold shadow-md shadow-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[20px] fill">add</span>
              <span className="whitespace-nowrap">Nuevo Pedido</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col bg-white dark:bg-[#1a2634] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-slate-900 dark:text-white font-bold text-lg">Últimos Movimientos</h4>
          <button 
            onClick={() => navigate('/pedidos')}
            className="text-primary text-sm font-semibold hover:underline"
          >
            Ver todo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold">
              <tr>
                <th className="px-6 py-4">ID Pedido</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {orders.slice(0, 3).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full size-8 flex items-center justify-center font-bold text-xs">
                        {order.client.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span>{order.client}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      order.status === OrderStatus.PENDIENTE_ARMADO ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                      order.status === OrderStatus.PENDIENTE_FACTURACION ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      order.status === OrderStatus.FACTURADO ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                      'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        order.status === OrderStatus.PENDIENTE_ARMADO ? 'bg-orange-500' :
                        order.status === OrderStatus.PENDIENTE_FACTURACION ? 'bg-blue-500' :
                        order.status === OrderStatus.FACTURADO ? 'bg-emerald-500' :
                        'bg-teal-500'
                      }`}></span>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      {order.actualTotal !== undefined && order.actualTotal !== null ? (
                        <>
                          <span className="font-medium text-slate-900 dark:text-white">
                            ${order.actualTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Total real
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-slate-900 dark:text-white">
                            ${order.estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          {hasUnweighedKGProducts(order) ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                              Total parcial - Pendiente pesaje
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Total estimado
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="relative">
                      <button 
                        onContextMenu={(e) => handleContextMenu(e, order)}
                        className="text-slate-400 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                      {contextMenuOrder && contextMenuOrder.order.id === order.id && (
                        <div
                          ref={contextMenuRef}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a2634] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
                          style={{
                            top: '100%',
                            left: contextMenuOrder.x < window.innerWidth / 2 ? '0' : 'auto',
                            right: contextMenuOrder.x >= window.innerWidth / 2 ? '0' : 'auto',
                          }}
                        >
                          <button
                            onClick={() => handleMenuAction('view', order)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            Ver detalles
                          </button>
                          <button
                            onClick={() => handleMenuAction('edit', order)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Editar
                          </button>
                          <button
                            onClick={() => handleMenuAction('delete', order)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <NewOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
