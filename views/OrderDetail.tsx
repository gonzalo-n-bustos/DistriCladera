
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../contexts/OrdersContext';
import { useProducts } from '../contexts/ProductsContext';
import { useClients } from '../contexts/ClientsContext';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useAudit } from '../contexts/AuditContext';
import StatusBadge from '../components/StatusBadge';
import WeightInputModal from '../components/WeightInputModal';
import ClientObservationsModal from '../components/ClientObservationsModal';
import OrderObservationsModal from '../components/OrderObservationsModal';
import EditOrderModal from '../components/EditOrderModal';
import { Order, OrderStatus } from '../types';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, hasUnweighedKGProducts, changeOrderStatus, updateOrderWeights, updateOrder, calculateActualTotal } = useOrders();
  const { products } = useProducts();
  const { clients } = useClients();
  const { user } = useAuth();
  const { canEditOrder, canToggleLogisticsCheck, canToggleFacturacionCheck, canToggleAdminCheck } = usePermissions();
  const { addAuditEntry } = useAudit();
  const [weightModalOrder, setWeightModalOrder] = useState<{ order: any; targetStatus: OrderStatus } | null>(null);
  const [clientObservationsModalOpen, setClientObservationsModalOpen] = useState(false);
  const [orderObservationsModalOpen, setOrderObservationsModalOpen] = useState(false);
  const [editOrderModalOpen, setEditOrderModalOpen] = useState(false);

  // Remover el # del ID si existe
  const orderId = id?.startsWith('#') ? id : `#${id}`;
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="max-w-[1200px] mx-auto flex flex-col items-center justify-center gap-4 py-12">
        <span className="material-symbols-outlined text-6xl text-slate-400">error_outline</span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pedido no encontrado</h2>
        <p className="text-slate-500 dark:text-slate-400">El pedido {orderId} no existe.</p>
        <button
          onClick={() => navigate('/pedidos')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver a Pedidos
        </button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!user) return;
    
    // Si se está cambiando a "Pendiente de Facturación" y hay productos KG sin pesar
    if (newStatus === OrderStatus.PENDIENTE_FACTURACION && hasUnweighedKGProducts(order)) {
      // Mostrar modal de ingreso de peso primero
      setWeightModalOrder({ order, targetStatus: newStatus });
      return;
    }

    // Cambio de estado normal
    const success = changeOrderStatus(
      orderId,
      newStatus,
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );

    if (!success) {
      alert('No se pudo cambiar el estado. Verifica tus permisos.');
    }
  };

  const handleConfirmWeights = (
    orderId: string,
    weights: { [productId: string]: number },
    targetStatus: OrderStatus,
    quantities?: { [productId: string]: number }
  ) => {
    if (!user) return;

    const currentOrder = orders.find(o => o.id === orderId);
    if (currentOrder && quantities && Object.keys(quantities).length > 0) {
      const newOrderItems = currentOrder.orderItems.map(item => {
        if (item.unit === 'KG' && quantities[item.productId] !== undefined) {
          return { ...item, estimatedQuantity: quantities[item.productId] };
        }
        return item;
      });
      const newItemsCount = newOrderItems.reduce((s, i) => s + i.estimatedQuantity, 0);
      updateOrder(orderId, { orderItems: newOrderItems, items: newItemsCount }, user.id, user.name, user.role);
    }

    const success = updateOrderWeights(
      orderId,
      weights,
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );

    if (!success) {
      alert('No se pudieron actualizar los pesos.');
      return;
    }

    setWeightModalOrder(null);

    changeOrderStatus(
      orderId,
      targetStatus,
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );
  };

  const client = clients.find(c => c.name === order.client);

  const handleItemCompleted = (itemIndex: number, completed: boolean) => {
    if (!user) return;
    const newOrderItems = order.orderItems.map((item, i) =>
      i === itemIndex ? { ...item, completed } : item
    );
    updateOrder(orderId, { orderItems: newOrderItems }, user.id, user.name, user.role);
  };

  const handleItemBilledByFacturacion = (itemIndex: number, billedByFacturacion: boolean) => {
    if (!user) return;
    const newOrderItems = order.orderItems.map((item, i) =>
      i === itemIndex ? { ...item, billedByFacturacion } : item
    );
    updateOrder(orderId, { orderItems: newOrderItems }, user.id, user.name, user.role);
    addAuditEntry({
      user: user.name,
      role: user.role,
      action: 'Modificado',
      reference: orderId,
      details: billedByFacturacion ? 'Facturación marcó artículo como facturado.' : 'Facturación desmarcó artículo como facturado.',
    });
  };

  const handleItemVerifiedByAdmin = (itemIndex: number, verifiedByAdmin: boolean) => {
    if (!user) return;
    const newOrderItems = order.orderItems.map((item, i) =>
      i === itemIndex ? { ...item, verifiedByAdmin } : item
    );
    updateOrder(orderId, { orderItems: newOrderItems }, user.id, user.name, user.role);
    addAuditEntry({
      user: user.name,
      role: user.role,
      action: 'Modificado',
      reference: orderId,
      details: verifiedByAdmin ? 'Admin verificó artículo del pedido.' : 'Admin desmarcó verificación del artículo.',
    });
  };

  const handleSaveEditOrder = (updated: Partial<Order>) => {
    if (!user) return;
    const payload: Partial<Order> = { ...updated };
    if (updated.orderItems) {
      payload.items = updated.orderItems.reduce((s, i) => s + i.estimatedQuantity, 0);
      payload.actualTotal = calculateActualTotal(updated.orderItems);
    }
    updateOrder(orderId, payload, user.id, user.name, user.role);
    addAuditEntry({
      user: user.name,
      role: user.role,
      action: 'Modificado',
      reference: orderId,
      details: `Pedido modificado. Cliente: ${updated.client ?? order.client}`,
    });
    setEditOrderModalOpen(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pedidos')}
          className="flex items-center justify-center size-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          title="Volver"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            {order.id}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Detalles del pedido</p>
        </div>
        {user && canEditOrder(order.status) && (
          <button
            type="button"
            onClick={() => setEditOrderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar pedido
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Información Principal */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Información del Cliente */}
          <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Información del Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Cliente</span>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{order.client}</p>
              </div>
              {order.rut && (
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">RUT</span>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{order.rut}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Dirección</span>
                <p className="text-base font-medium text-slate-900 dark:text-white">
                  {client?.address ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Fecha</span>
                <p className="text-base font-medium text-slate-900 dark:text-white">{order.date}</p>
              </div>
              <div className="sm:col-span-2 pt-1.5 flex flex-wrap gap-2">
                {client && (
                  <button
                    type="button"
                    onClick={() => setClientObservationsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Observaciones del cliente
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOrderObservationsModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    order.notes?.trim()
                      ? 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/25 dark:shadow-primary/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {order.notes?.trim() ? 'note' : 'description'}
                  </span>
                  Observaciones del pedido
                  {order.notes?.trim() && (
                    <span className="size-2 rounded-full bg-white/90 shrink-0" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Productos del Pedido */}
          <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Productos del Pedido</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-2 py-3 w-10 text-center" title="Artículo listo por logística">
                      <span className="sr-only">Logística</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Log.</span>
                    </th>
                    <th className="px-2 py-3 w-10 text-center" title="Artículo facturado">
                      <span className="sr-only">Facturación</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fact.</span>
                    </th>
                    <th className="px-2 py-3 w-10 text-center" title="Verificado por admin: coincide con lo facturado">
                      <span className="sr-only">Admin</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Admin</span>
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">ID</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Descripción</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Cantidad</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Peso (kg)</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400">Precio por unidad/KG</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {order.orderItems.map((item, index) => {
                    const productInfo = products.find(p => p.id === item.productId);
                    const quantityFormatted = item.estimatedQuantity.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                    const quantityUnitLabel = item.unit === 'KG' ? '' : 'unidades';
                    const subtotal = item.unit === 'KG' && item.actualWeight != null && item.actualWeight > 0
                      ? item.actualWeight * item.price
                      : item.unit === 'Unidad'
                      ? item.estimatedQuantity * item.price
                      : 0;
                    const hasWeight = item.unit === 'KG' && item.actualWeight != null && item.actualWeight > 0;
                    const priceUnitLabel = item.unit === 'KG' ? 'kg' : 'unidad';

                    const canLogistics = user && canToggleLogisticsCheck();
                    const canFacturacion = user && canToggleFacturacionCheck();
                    const canAdmin = user && canToggleAdminCheck();

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                          item.completed ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                        } ${item.billedByFacturacion ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${
                          item.verifiedByAdmin ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
                        }`}
                      >
                        <td className="px-2 py-4 w-10 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={item.completed ?? false}
                            onChange={(e) => handleItemCompleted(index, e.target.checked)}
                            disabled={!canLogistics}
                            title={canLogistics ? (item.completed ? 'Marcar como pendiente' : 'Artículo listo por logística') : 'Sin permiso'}
                            aria-label={item.completed ? 'Marcar como pendiente (logística)' : 'Marcar como completado (logística)'}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-2 py-4 w-10 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={item.billedByFacturacion ?? false}
                            onChange={(e) => handleItemBilledByFacturacion(index, e.target.checked)}
                            disabled={!canFacturacion}
                            title={canFacturacion ? (item.billedByFacturacion ? 'Desmarcar como facturado' : 'Marcar como facturado') : 'Sin permiso'}
                            aria-label={item.billedByFacturacion ? 'Desmarcar como facturado' : 'Marcar como facturado'}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-2 py-4 w-10 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={item.verifiedByAdmin ?? false}
                            onChange={(e) => handleItemVerifiedByAdmin(index, e.target.checked)}
                            disabled={!canAdmin}
                            title={canAdmin ? (item.verifiedByAdmin ? 'Desmarcar verificación' : 'Verificado por admin') : 'Sin permiso'}
                            aria-label={item.verifiedByAdmin ? 'Desmarcar verificación admin' : 'Verificado por admin'}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.productId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{productInfo?.name ?? '—'}</p>
                            {productInfo?.brand && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{productInfo.brand}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {quantityFormatted}{quantityUnitLabel ? ` ${quantityUnitLabel}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {item.unit === 'KG'
                            ? (item.actualWeight != null && item.actualWeight > 0
                                ? item.actualWeight.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                : '—')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          ${item.price.toLocaleString('es-ES', { minimumFractionDigits: 2 })} / {priceUnitLabel}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                          {item.unit === 'KG' && !hasWeight
                            ? <span className="text-amber-600 dark:text-amber-400">Pendiente</span>
                            : `$${subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Lateral */}
        <div className="flex flex-col gap-4">
          {/* Estado y Resumen */}
          <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Estado</h2>
            <StatusBadge
              status={order.status}
              orderId={order.id}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Resumen Financiero */}
          <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Resumen</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Items</span>
                <span className="font-semibold text-slate-900 dark:text-white">{order.items} items</span>
              </div>
              {order.actualTotal !== undefined && order.actualTotal !== null ? (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${order.actualTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total real</p>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${order.estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {hasUnweighedKGProducts(order) ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Total parcial - Pendiente pesaje</p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total estimado</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {weightModalOrder && (
        <WeightInputModal
          isOpen={true}
          onClose={() => setWeightModalOrder(null)}
          order={weightModalOrder.order}
          products={products}
          onConfirm={(weights, quantities) => handleConfirmWeights(weightModalOrder.order.id, weights, weightModalOrder.targetStatus, quantities)}
        />
      )}

      <ClientObservationsModal
        isOpen={clientObservationsModalOpen}
        onClose={() => setClientObservationsModalOpen(false)}
        clientName={order.client}
        notes={client?.notes}
      />

      <OrderObservationsModal
        isOpen={orderObservationsModalOpen}
        onClose={() => setOrderObservationsModalOpen(false)}
        orderId={order.id}
        notes={order.notes}
        onSave={(notes) => {
          if (!user) return;
          updateOrder(orderId, { notes }, user.id, user.name, user.role);
          addAuditEntry({
            user: user.name,
            role: user.role,
            action: 'Modificado',
            reference: orderId,
            details: 'Observaciones del pedido actualizadas.',
          });
        }}
      />

      <EditOrderModal
        isOpen={editOrderModalOpen}
        onClose={() => setEditOrderModalOpen(false)}
        order={order}
        onSave={handleSaveEditOrder}
      />
    </div>
  );
};

export default OrderDetail;
