import React, { useState } from 'react';
import { OrderStatus } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import {
  getStatusColorsForModalOption,
  getStatusColorsForBadge,
} from '../config/businessRules';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: OrderStatus;
  orderId: string;
  onStatusChange: (newStatus: OrderStatus) => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  onClose,
  currentStatus,
  orderId,
  onStatusChange,
}) => {
  const { getAvailableStatusTransitions } = usePermissions();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string>('');

  const availableTransitions = getAvailableStatusTransitions(currentStatus);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedStatus(null);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      setError('Debes seleccionar un nuevo estado');
      return;
    }

    if (!user) {
      setError('No hay usuario autenticado');
      return;
    }

    onStatusChange(selectedStatus);
    onClose();
  };

  if (!isOpen) return null;

  const getStatusLabel = (status: OrderStatus): string => status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cambiar Estado del Pedido</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6">
          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Pedido
            </label>
            <p className="text-slate-900 dark:text-white font-medium">{orderId}</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Estado Actual
            </label>
            {(() => {
              const colors = getStatusColorsForBadge(currentStatus);
              return (
                <div
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg} ${colors.text}`}
                >
                  <span className={`h-2 w-2 rounded-full ${colors.dot}`}></span>
                  <span className="font-medium">{getStatusLabel(currentStatus)}</span>
                </div>
              );
            })()}
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Nuevo Estado <span className="text-red-500">*</span>
            </label>
            {availableTransitions.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No hay transiciones disponibles para este estado con tu rol actual.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTransitions.map((status) => {
                  const isSelected = selectedStatus === status;
                  const colors = getStatusColorsForModalOption(status, isSelected);
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(status);
                        setError('');
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${colors.border} ${colors.bg}`
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? `${colors.border} ${colors.dot}`
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`h-2 w-2 rounded-full ${colors.dot}`}></span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {getStatusLabel(status)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={availableTransitions.length === 0 || !selectedStatus}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cambiar Estado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
