import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Client } from '../types';
import { INITIAL_CLIENTS } from '../constants';

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'initials'>, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  updateClient: (id: string, client: Partial<Client>, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
  deleteClient: (id: string, userId: string, userName: string, userRole: string, onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void) => void;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return '??';
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
};

export const ClientsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);

  const generateClientId = (): string => {
    let max = 0;
    for (const c of clients) {
      const match = c.id.match(/^CL-(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > max) max = n;
      }
    }
    const next = String(max + 1).padStart(3, '0');
    return `CL-${next}`;
  };

  const addClient = (
    clientData: Omit<Client, 'id' | 'initials'>,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const newClient: Client = {
      ...clientData,
      id: generateClientId(),
      initials: getInitials(clientData.name),
    };
    setClients(prev => [...prev, newClient]);
    
    // Registrar en auditoría
    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Creado',
      reference: newClient.id,
      details: `Cliente creado: ${newClient.name} - ${newClient.address}`,
    });
  };

  const updateClient = (
    id: string,
    clientData: Partial<Client>,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const oldClient = clients.find(c => c.id === id);
    if (!oldClient) return;

    // Si cambia el nombre, actualizar las iniciales
    const updatedClient = { ...clientData };
    if (clientData.name && clientData.name !== oldClient.name) {
      (updatedClient as Client).initials = getInitials(clientData.name);
    }

    setClients(prev =>
      prev.map(client => (client.id === id ? { ...client, ...updatedClient } : client))
    );

    // Registrar en auditoría
    const changes: string[] = [];
    if (clientData.name && clientData.name !== oldClient.name) {
      changes.push(`nombre: "${oldClient.name}" → "${clientData.name}"`);
    }
    if (clientData.address && clientData.address !== oldClient.address) {
      changes.push(`dirección: "${oldClient.address}" → "${clientData.address}"`);
    }
    if (clientData.status && clientData.status !== oldClient.status) {
      changes.push(`estado: ${oldClient.status} → ${clientData.status}`);
    }

    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Modificado',
      reference: id,
      details: `Cliente modificado. Cambios: ${changes.join(', ')}`,
    });
  };

  const deleteClient = (
    id: string,
    userId: string,
    userName: string,
    userRole: string,
    onAuditLog: (entry: { user: string; role: string; action: string; reference: string; details: string }) => void
  ) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    setClients(prev => prev.filter(c => c.id !== id));

    // Registrar en auditoría
    onAuditLog({
      user: userName,
      role: userRole,
      action: 'Eliminado',
      reference: id,
      details: `Cliente eliminado: ${client.name}`,
    });
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, deleteClient }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients debe usarse dentro de ClientsProvider');
  }
  return context;
};
