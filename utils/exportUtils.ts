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

export const exportStudentsToExcel = async (students: import('../types').Student[], reportMonth: number, reportYear: number, className: string) => {
    if (!students || students.length === 0) {
        alert("Không có dữ liệu học sinh để xuất.");
        return;
    }

    try {
        const XLSX = await import('xlsx');

        const getConductRating = (score: number) => {
            if (score >= 90) return 'Tốt';
            if (score >= 70) return 'Khá';
            if (score >= 50) return 'Đạt';
            return 'Chưa Đạt';
        };

        const dataRows = students.map((student, index) => {
            const records = student.behaviorRecords || [];
            const approvedRecords = records.filter(r => r.status === 'approved');

            const monthsMap = new Map<string, { score: number, month: number, year: number }>();
            approvedRecords.forEach(r => {
                const d = new Date(r.timestamp);
                const key = `${d.getMonth()}-${d.getFullYear()}`;
                if (!monthsMap.has(key)) {
                    monthsMap.set(key, { score: 100, month: d.getMonth(), year: d.getFullYear() });
                }
                const current = monthsMap.get(key)!;
                current.score += r.score;
            });

            const monthlyStats = Array.from(monthsMap.values());
            let sem1Total = 0, sem1Count = 0;
            let sem2Total = 0, sem2Count = 0;
            let currentMonthScore = 100;

            monthlyStats.forEach(stat => {
                if ([7, 8, 9, 10, 11, 0].includes(stat.month)) {
                    sem1Total += stat.score;
                    sem1Count++;
                } else {
                    sem2Total += stat.score;
                    sem2Count++;
                }
                if (stat.month === reportMonth && stat.year === reportYear) {
                    currentMonthScore = stat.score;
                }
            });

            const sem1Avg = sem1Count > 0 ? (sem1Total / sem1Count).toFixed(1) : '';
            const sem2Avg = sem2Count > 0 ? (sem2Total / sem2Count).toFixed(1) : '';
            const yearAvg = (sem1Count + sem2Count) > 0 ? ((sem1Total + sem2Total) / (sem1Count + sem2Count)).toFixed(1) : '';

            let w1 = 100, w2 = 100, w3 = 100, w4 = 100;
            let pGhiChu: string[] = [];

            approvedRecords.forEach(r => {
                const d = new Date(r.timestamp);
                if (d.getMonth() === reportMonth && d.getFullYear() === reportYear) {
                    const date = d.getDate();
                    if (date >= 1 && date <= 7) w1 += r.score;
                    else if (date >= 8 && date <= 14) w2 += r.score;
                    else if (date >= 15 && date <= 21) w3 += r.score;
                    else w4 += r.score;

                    if (r.score < 0) {
                        pGhiChu.push(`Ngày ${date}: ${r.description} (${r.score})`);
                    }
                }
            });

            return {
                'STT': index + 1,
                'Mã Học Sinh': student.shortName || '',
                'Họ và Tên': student.fullName,
                'SĐT Phụ Huynh': student.parentPhone || '',
                'Tuần 1 (1-7)': w1,
                'Tuần 2 (8-14)': w2,
                'Tuần 3 (15-21)': w3,
                'Tuần 4 (22+)': w4,
                [`Tổng Điểm T${reportMonth+1}`]: currentMonthScore,
                [`Xếp loại T${reportMonth+1}`]: getConductRating(currentMonthScore),
                'Chi tiết Vi Phạm (Tháng)': pGhiChu.join('; '),
                'TB HK1': sem1Avg ? Number(sem1Avg) : '',
                'TB HK2': sem2Avg ? Number(sem2Avg) : '',
                'TỔNG KẾT NĂM': yearAvg ? Number(yearAvg) : '',
                'XẾP LOẠI NĂM': yearAvg ? getConductRating(Number(yearAvg)) : 'Chưa xếp loại',
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataRows);

        // Styling columns width
        worksheet['!cols'] = [
            { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            { wch: 18 }, { wch: 15 }, { wch: 40 }, 
            { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 18 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `T${reportMonth+1}-${reportYear}`);
        
        const fileName = `Bao_Cao_Lop_${className}_T${reportMonth+1}_${reportYear}.xlsx`.replace(/\s+/g, '_');
        XLSX.writeFile(workbook, fileName);
    } catch (err) {
        console.error("Lỗi xuất Excel:", err);
        alert("Không thể xuất file lúc này, vui lòng kiểm tra kết nối mạng.");
    }
};
