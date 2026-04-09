import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: Partial<User>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Vendedor' as UserRole,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (!form.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'El email no tiene un formato válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    
    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    });
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1a2634] rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/10 size-12 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Editar Usuario</h3>
              <p className="text-sm text-slate-500">Modifica los detalles del usuario.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ID de Usuario</label>
              <input
                type="text"
                value={user.id}
                readOnly
                className="mt-1 block w-full rounded-lg border-slate-300 bg-slate-100 dark:bg-slate-800 dark:border-slate-700 shadow-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Ej: Juan Pérez"
                className={`mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary text-slate-900 dark:text-white ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección de Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="juan@empresa.com"
                className={`mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary text-slate-900 dark:text-white ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Asignar Rol <span className="text-red-500">*</span></label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary text-slate-900 dark:text-white"
              >
                <option value="Admin">Administrador (Acceso Completo)</option>
                <option value="Vendedor">Vendedor (Crear y gestionar pedidos)</option>
                <option value="Logística">Logística (Armar y entregar pedidos)</option>
                <option value="Facturación">Facturación (Facturar pedidos)</option>
              </select>
            </div>
          </form>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
