export const exportToCSV = (seatingChart: import('../types').SeatingChart) => {
  if (seatingChart.length === 0) { alert("Sơ đồ lớp học trống."); return; }
  const cols = seatingChart[0].length;
  let csvContent = "\uFEFF"; 
  csvContent += "SƠ ĐỒ LỚP HỌC\r\n";
  csvContent += `Ngày xuất: ${new Date().toLocaleString('vi-VN')}\r\n\r\n`;
  const topRow = new Array(cols).fill('');
  const podiumPosition = Math.floor(cols / 2);
  topRow[podiumPosition] = "BỤC GIẢNG";
  if (cols > 1) topRow[cols - 1] = "CỬA LỚP"; else topRow[0] += " / CỬA LỚP";
  csvContent += topRow.map(cell => `"${cell}"`).join(',') + '\r\n';
  csvContent += new Array(cols).fill('""').join(',') + '\r\n';
  seatingChart.forEach((row, rowIndex) => {
    const rowData = row.map((table, tableIndex) => {
      const tableNumber = (rowIndex * cols) + (cols - tableIndex);
      const studentNames = table.map(student => student.fullName).join("\n");
      const cellContent = `Bàn ${tableNumber}\n${studentNames}`;
      return `"${cellContent.trim()}"`;
    }).join(',');
    csvContent += rowData + "\r\n";
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "so_do_lop_hoc.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
