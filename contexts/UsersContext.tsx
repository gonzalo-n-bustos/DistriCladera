import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../constants';

interface UsersContextType {
  users: User[];
  addUser: (user: Omit<User, 'id'>, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  updateUser: (id: string, user: Partial<User>, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  deleteUser: (id: string, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  toggleUserStatus: (id: string, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const generateUserId = (): string => {
    const lastUser = users[users.length - 1];
    if (lastUser) {
      const match = lastUser.id.match(/^U-(\d+)$/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        return `U-${String(lastNumber + 1).padStart(3, '0')}`;
      }
    }
    return 'U-006';
  };

  const addUser = (
    userData: Omit<User, 'id'>,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const newUser: User = {
      ...userData,
      id: generateUserId(),
      status: userData.status !== undefined ? userData.status : true,
    };
    setUsers(prev => [...prev, newUser]);
    
    // Registrar en auditoría
    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Creado',
      reference: newUser.id,
      details: `Usuario creado: ${newUser.name} (${newUser.email}) - Rol: ${newUser.role}`,
    });
  };

  const updateUser = (
    id: string,
    userData: Partial<User>,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const oldUser = users.find(u => u.id === id);
    if (!oldUser) return;

    setUsers(prev =>
      prev.map(user => (user.id === id ? { ...user, ...userData } : user))
    );

    // Registrar en auditoría
    const changes: string[] = [];
    if (userData.name && userData.name !== oldUser.name) {
      changes.push(`nombre: "${oldUser.name}" → "${userData.name}"`);
    }
    if (userData.email && userData.email !== oldUser.email) {
      changes.push(`email: "${oldUser.email}" → "${userData.email}"`);
    }
    if (userData.role && userData.role !== oldUser.role) {
      changes.push(`rol: ${oldUser.role} → ${userData.role}`);
    }

    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Modificado',
      reference: id,
      details: `Usuario modificado. Cambios: ${changes.join(', ')}`,
    });
  };

  const deleteUser = (
    id: string,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    setUsers(prev => prev.filter(u => u.id !== id));

    // Registrar en auditoría
    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Eliminado',
      reference: id,
      details: `Usuario eliminado: ${user.name} (${user.email})`,
    });
  };

  const toggleUserStatus = (
    id: string,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const newStatus = !user.status;
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, status: newStatus } : u))
    );

    // Registrar en auditoría
    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Cambio de Estado',
      reference: id,
      details: `Estado de usuario cambiado: ${user.name} - ${user.status ? 'Activo' : 'Inactivo'} → ${newStatus ? 'Activo' : 'Inactivo'}`,
    });
  };

  return (
    <UsersContext.Provider value={{ users, addUser, updateUser, deleteUser, toggleUserStatus }}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers debe usarse dentro de UsersProvider');
  }
  return context;
};
