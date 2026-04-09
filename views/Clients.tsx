import React, { useState, useMemo } from 'react';
import type { Client } from '../types';
import { useClients } from '../contexts/ClientsContext';
import { useAuth } from '../hooks/useAuth';
import { useAudit } from '../contexts/AuditContext';
import NewClientModal from '../components/NewClientModal';
import EditClientModal from '../components/EditClientModal';

const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { user } = useAuth();
  const { addAuditEntry } = useAudit();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const matchesSearch = (client: Client, query: string): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const id = client.id.toLowerCase();
    const name = client.name.toLowerCase();
    const address = client.address.toLowerCase();
    return id.includes(q) || name.includes(q) || address.includes(q);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => matchesSearch(client, searchQuery));
  }, [clients, searchQuery]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const abrirModal = () => setModalOpen(true);
  const cerrarModal = () => setModalOpen(false);

  const handleAddClient = (client: Client) => {
    if (!user) return;
    addClient(
      {
        name: client.name,
        address: client.address,
        status: client.status,
        phone: client.phone,
        email: client.email,
        contactPerson: client.contactPerson,
        notes: client.notes,
      },
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleSaveEditClient = (updatedClient: Partial<Client>) => {
    if (!editingClient || !user) return;
    
    updateClient(
      editingClient.id,
      updatedClient,
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );
    
    setIsEditModalOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = (client: Client) => {
    if (!user) return;
    
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el cliente ${client.id}?\n\n${client.name}\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    deleteClient(
      client.id,
      user.id,
      user.name,
      user.role,
      addAuditEntry
    );
  };

  return (
    <div className="container mx-auto max-w-7xl flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="mb-2 flex items-center text-sm">
        <a className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium" href="#">Inicio</a>
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-900 dark:text-white font-medium">Clientes</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Administración de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Gestiona tu red de distribuidores y socios.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a2634] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150" 
            placeholder="Buscar por nombre..." 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Buscar clientes por nombre, código o dirección"
          />
        </div>
        <button
          type="button"
          onClick={abrirModal}
          id="btnCrearCliente"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Crear Cliente</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a2634] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Código de Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    {searchQuery.trim() ? 'No se encontraron clientes. Probá con otro término.' : 'No hay clientes registrados.'}
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{client.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${
                          client.id === 'CL-001' ? 'bg-blue-100 text-blue-600' :
                          client.id === 'CL-002' ? 'bg-orange-100 text-orange-600' :
                          client.id === 'CL-003' ? 'bg-purple-100 text-purple-600' :
                          'bg-emerald-100 text-emerald-600'
                        } dark:bg-opacity-20`}>{client.initials}</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500 dark:text-slate-400">{client.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        client.status === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        client.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClient(client)}
                          className="text-slate-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteClient(client)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
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
        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-700 dark:text-slate-400">
            Mostrando <span className="font-medium text-slate-900 dark:text-white">
              {filteredClients.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : '0'}
            </span> a <span className="font-medium text-slate-900 dark:text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)}
            </span> de <span className="font-medium text-slate-900 dark:text-white">{filteredClients.length}</span> resultados
          </p>
          <nav className="inline-flex rounded-md shadow-sm -space-x-px">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'z-10 bg-primary/10 dark:bg-primary/20 border-primary text-primary'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </nav>
        </div>
      </div>

      <NewClientModal
        isOpen={modalOpen}
        onClose={cerrarModal}
        clients={clients}
        onAddClient={handleAddClient}
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingClient(null);
        }}
        client={editingClient}
        onSave={handleSaveEditClient}
      />
    </div>
  );
};

export default Clients;
