import React, { useState } from 'react';
import { OrderStatus } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { getStatusColorsForBadge } from '../config/businessRules';
import ChangeStatusModal from './ChangeStatusModal';

interface StatusBadgeProps {
  status: OrderStatus;
  orderId: string;
  onStatusChange: (newStatus: OrderStatus) => void;
  showChangeButton?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  orderId,
  onStatusChange,
  showChangeButton = true,
}) => {
  const { canChangeOrderStatus } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canChange = canChangeOrderStatus(status);
  const colors = getStatusColorsForBadge(status);

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
        >
          <span className={`size-1.5 rounded-full ${colors.dot}`}></span>
          {status}
        </span>
        {showChangeButton && canChange && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="text-slate-400 hover:text-primary transition-colors p-1 rounded"
            title="Cambiar estado"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        )}
      </div>

      <ChangeStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentStatus={status}
        orderId={orderId}
        onStatusChange={onStatusChange}
      />
    </>
  );
};

export default StatusBadge;
