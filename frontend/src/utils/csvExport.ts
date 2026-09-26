/**
 * Helper utility to export tabular dataset to a CSV file.
 * Handles escaping and dates in filenames.
 */
export const exportToCSV = (
  data: any[],
  headers: { key: string; label: string }[],
  fileNamePrefix: string = 'easytrack_export'
) => {
  if (data.length === 0) return;

  const csvRows: string[] = [];

  // 1. Header row
  const headerStrings = headers.map(h => `"${h.label.replace(/"/g, '""')}"`);
  csvRows.push(headerStrings.join(','));

  // 2. Data rows
  data.forEach(row => {
    const rowStrings = headers.map(h => {
      let value = row[h.key];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      // Escape quotes
      return `"${value.replace(/"/g, '""')}"`;
    });
    csvRows.push(rowStrings.join(','));
  });

  // 3. Trigger Download
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${fileNamePrefix}_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
