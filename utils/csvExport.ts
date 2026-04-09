export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Obtener las claves del primer objeto como encabezados
  const headers = Object.keys(data[0]);
  
  // Crear la fila de encabezados
  const csvHeaders = headers.join(',');
  
  // Crear las filas de datos
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escapar comillas y envolver en comillas si contiene comas o comillas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  // Combinar encabezados y filas
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  // Crear el BOM para UTF-8 (permite que Excel abra el archivo correctamente)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Crear un enlace de descarga
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
