import React, { useState, useMemo } from 'react';
import { useUsers } from '../contexts/UsersContext';
import { useAuth } from '../hooks/useAuth';
import { useAudit } from '../contexts/AuditContext';
import { User, UserRole } from '../types';
import EditUserModal from '../components/EditUserModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Users: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus } = useUsers();
  const { user: currentUser } = useAuth();
  const { addAuditEntry } = useAudit();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Vendedor' as UserRole,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        !searchTerm.trim() ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = statusFilter === '' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const validateNewUser = (): boolean => {
    const errors: Record<string, string> = {};
    if (!newUserForm.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    if (!newUserForm.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!EMAIL_REGEX.test(newUserForm.email.trim())) {
      errors.email = 'El email no tiene un formato válido';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = () => {
    if (!validateNewUser() || !currentUser) return;
    
    addUser(
      {
        name: newUserForm.name.trim(),
        email: newUserForm.email.trim(),
        role: newUserForm.role,
        status: true,
        avatar: `https://picsum.photos/seed/${newUserForm.name}/100/100`,
      },
      currentUser.id,
      currentUser.name,
      currentUser.role,
      addAuditEntry
    );
    
    setIsModalOpen(false);
    setNewUserForm({ name: '', email: '', role: 'Vendedor' });
    setFormErrors({});
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = (updatedUser: Partial<User>) => {
    if (!editingUser || !currentUser) return;
    
    updateUser(
      editingUser.id,
      updatedUser,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      addAuditEntry
    );
    
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleToggleStatus = (user: User) => {
    if (!currentUser) return;
    toggleUserStatus(
      user.id,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      addAuditEntry
    );
  };

  const handleDeleteUser = (user: User) => {
    if (!currentUser) return;
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el usuario ${user.id}?\n\n${user.name} (${user.email})\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    deleteUser(
      user.id,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      addAuditEntry
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
      <nav className="flex items-center text-sm font-medium text-slate-500">
        <a className="hover:text-primary transition-colors" href="#">Inicio</a>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white">Gestión de Usuarios</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Gestiona el acceso al sistema, asigna roles y controla los estados de los usuarios.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="font-semibold text-sm">Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a2634] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input 
            className="block w-full pl-10 pr-3 py-2.5 border-none bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary transition-all" 
            placeholder="Buscar usuarios por nombre, email o rol..." 
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | '');
              setCurrentPage(1);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap border-none cursor-pointer"
          >
            <option value="">Todos los Roles</option>
            <option value="Admin">Admin</option>
            <option value="Vendedor">Vendedor</option>
            <option value="Logística">Logística</option>
            <option value="Facturación">Facturación</option>
          </select>
          <select
            value={statusFilter === '' ? '' : statusFilter ? 'true' : 'false'}
            onChange={(e) => {
              setStatusFilter(e.target.value === '' ? '' : e.target.value === 'true');
              setCurrentPage(1);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap border-none cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
          {(searchTerm || roleFilter || statusFilter !== '') && (
            <button 
              onClick={handleClearFilters}
              className="text-primary text-sm font-semibold hover:underline px-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Usuario</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rol</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-cover bg-center ring-1 ring-slate-200 dark:ring-slate-700" style={{ backgroundImage: `url(${user.avatar})` }}></div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{user.name}</p>
                          <p className="text-slate-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Admin' ? 'bg-primary/10 text-primary border border-primary/20' :
                        user.role === 'Logística' ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                        user.role === 'Facturación' ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                        'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {user.role === 'Admin' ? 'Administrador' : user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user.status ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.status ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{user.status ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando <span className="font-semibold text-slate-900 dark:text-white">
              {filteredUsers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : '0'}
            </span> a <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
            </span> de <span className="font-semibold text-slate-900 dark:text-white">{filteredUsers.length}</span> usuarios
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#1a2634] rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 size-12 rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Agregar Nuevo Usuario</h3>
                  <p className="text-sm text-slate-500">Completa los detalles para crear una nueva cuenta de usuario.</p>
                </div>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo <span className="text-red-500">*</span></label>
                  <input 
                    className={`mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary text-slate-900 dark:text-white ${
                      formErrors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="Ej: Juan Pérez" 
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => {
                      setNewUserForm({ ...newUserForm, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección de Email <span className="text-red-500">*</span></label>
                  <input 
                    className={`mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary text-slate-900 dark:text-white ${
                      formErrors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="juan@empresa.com" 
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => {
                      setNewUserForm({ ...newUserForm, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                    }}
                  />
                  {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Asignar Rol <span className="text-red-500">*</span></label>
                  <select 
                    className="mt-1 block w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 shadow-sm focus:border-primary focus:ring-primary text-slate-900 dark:text-white"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
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
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg">Cancelar</button>
              <button onClick={handleCreateUser} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md">Crear Usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSaveEditUser}
      />
    </div>
  );
};

export default Users;
