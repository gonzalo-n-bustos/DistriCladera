import React, { useState, useEffect } from 'react';

interface OrderObservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  notes?: string;
  onSave: (notes: string) => void;
}

const OrderObservationsModal: React.FC<OrderObservationsModalProps> = ({
  isOpen,
  onClose,
  orderId,
  notes = '',
  onSave,
}) => {
  const [value, setValue] = useState(notes);

  useEffect(() => {
    setValue(notes ?? '');
  }, [isOpen, notes]);

  if (!isOpen) return null;

  const handleGuardar = () => {
    onSave(value.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a2634] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Observaciones del Pedido</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Pedido</span>
            <p className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">{orderId}</p>
          </div>
          <div>
            <label htmlFor="order-notes" className="block text-sm text-slate-500 dark:text-slate-400 mb-1.5">
              Observaciones
            </label>
            <textarea
              id="order-notes"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ej: Horario de entrega, instrucciones especiales..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-y min-h-[120px]"
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleGuardar}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderObservationsModal;
