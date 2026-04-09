import React, { useState, useMemo } from 'react';
import { useAudit } from '../contexts/AuditContext';
import { useUsers } from '../contexts/UsersContext';
import { exportToCSV } from '../utils/csvExport';
import { AuditEntry } from '../types';

const Audit: React.FC = () => {
  const { auditEntries } = useAudit();
  const { users } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      const matchesSearch = 
        !searchTerm.trim() ||
        entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = !userFilter || entry.user === userFilter;
      
      // Filtro de fecha simple (últimos 30 días por defecto si está seleccionado)
      const matchesDate = !dateRangeFilter || true; // Por ahora, siempre true. Se puede mejorar con un selector de rango real
      
      return matchesSearch && matchesUser && matchesDate;
    });
  }, [auditEntries, searchTerm, userFilter, dateRangeFilter]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Obtener lista única de usuarios para el filtro
  const uniqueUsers = useMemo(() => {
    const userSet = new Set(auditEntries.map(entry => entry.user));
    return Array.from(userSet).sort();
  }, [auditEntries]);

  const handleExportCSV = () => {
    const csvData = filteredEntries.map(entry => ({
      'ID': entry.id,
      'Usuario': entry.user,
      'Rol': entry.role,
      'Acción': entry.action,
      'Referencia': entry.reference,
      'Detalles': entry.details,
      'Fecha': entry.date,
      'Hora': entry.time,
    }));
    
    const filename = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(csvData, filename);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
      <nav className="flex mb-2">
        <ol className="inline-flex items-center space-x-1 md:space-x-3 text-sm font-medium">
          <li className="inline-flex items-center text-slate-500 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px] mr-2">home</span> Inicio
          </li>
          <li className="flex items-center text-slate-500">
            <span className="material-symbols-outlined text-slate-400 text-sm mx-1">chevron_right</span> Pedidos
          </li>
          <li className="flex items-center text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-slate-400 text-sm mx-1">chevron_right</span> Historial de Auditoría
          </li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Historial de Auditoría</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl text-sm">
            Registro completo e inmutable de todas las acciones del sistema. Utilice los filtros para localizar eventos específicos por usuario, fecha o referencia.
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Exportar CSV
        </button>
      </div>

      <div className="bg-white dark:bg-[#1a2634] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-4 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500">Buscar</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input 
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all text-slate-900 dark:text-white" 
                placeholder="ID de Pedido, Referencia..." 
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500">Usuario</label>
            <div className="relative">
              <select 
                className="w-full h-11 pl-4 pr-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer text-slate-900 dark:text-white"
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos los usuarios</option>
                {uniqueUsers.map((userName) => (
                  <option key={userName} value={userName}>
                    {userName}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <span className="material-symbols-outlined">expand_more</span>
              </span>
            </div>
          </div>
          <div className="lg:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500">Rango de Fechas</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </span>
              <input 
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm cursor-pointer text-slate-900 dark:text-white" 
                value="Últimos 30 días" 
                readOnly 
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <button 
              onClick={() => {
                setSearchTerm('');
                setUserFilter('');
                setDateRangeFilter('');
                setCurrentPage(1);
              }}
              className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary/30"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a2634] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acción</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Referencia</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detalles</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                          {entry.user.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.user}</p>
                          <p className="text-xs text-slate-500">{entry.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-900 dark:text-white font-medium tabular-nums">{entry.date}</span>
                        <span className="text-xs text-slate-500 tabular-nums">{entry.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        entry.action === 'Creado' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        entry.action === 'Cambio de Estado' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        entry.action === 'Eliminado' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          entry.action === 'Creado' ? 'bg-green-600' :
                          entry.action === 'Cambio de Estado' ? 'bg-blue-600' :
                          entry.action === 'Eliminado' ? 'bg-red-600' :
                          'bg-purple-600'
                        }`}></span>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-primary hover:underline">{entry.reference}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-xs">{entry.details}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">
              Mostrando <span className="font-semibold text-slate-900 dark:text-white">
                {filteredEntries.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : '0'}
              </span> a <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredEntries.length)}
              </span> de <span className="font-semibold text-slate-900 dark:text-white">{filteredEntries.length}</span> resultados
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Anterior
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-white shadow-sm'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;
