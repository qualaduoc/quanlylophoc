import { Student } from '../types';

export const printStudentReport = (student: Student, reportMonth: number, reportYear: number, sysSettings: any) => {
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

    const sem1Avg = sem1Count > 0 ? (sem1Total / sem1Count).toFixed(1) : '--';
    const sem2Avg = sem2Count > 0 ? (sem2Total / sem2Count).toFixed(1) : '--';
    const yearAvg = (sem1Count + sem2Count) > 0 ? ((sem1Total + sem2Total) / (sem1Count + sem2Count)).toFixed(1) : '--';

    let w1 = 100, w2 = 100, w3 = 100, w4 = 100;
    let penalties: {date: string, desc: string, score: number}[] = [];

    approvedRecords.forEach(r => {
        const d = new Date(r.timestamp);
        if (d.getMonth() === reportMonth && d.getFullYear() === reportYear) {
            const date = d.getDate();
            if (date >= 1 && date <= 7) w1 += r.score;
            else if (date >= 8 && date <= 14) w2 += r.score;
            else if (date >= 15 && date <= 21) w3 += r.score;
            else w4 += r.score;

            if (r.score < 0) {
                penalties.push({ date: d.toLocaleDateString('vi-VN'), desc: r.description, score: r.score });
            }
        }
    });

    const getConductRating = (score: number | string) => {
        if (score === '--') return '--';
        const num = Number(score);
        if (num >= 90) return 'Tốt';
        if (num >= 70) return 'Khá';
        if (num >= 50) return 'Đạt';
        return 'Chưa Đạt';
    };

    const schoolName = sysSettings?.school_name || 'THCS Nguyễn Hồng Ánh';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup.");
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>Phiếu Báo Cáo - ${student.fullName}</title>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    line-height: 1.5;
                    margin: 0;
                    padding: 40px;
                    color: #000;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .school-info {
                    text-align: center;
                    font-weight: bold;
                }
                .nation-info {
                    text-align: center;
                    font-weight: bold;
                }
                .title {
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-transform: uppercase;
                }
                .student-info {
                    margin-bottom: 30px;
                    font-size: 16px;
                }
                .student-info p {
                    margin: 5px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 8px 12px;
                    text-align: center;
                }
                th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .signatures {
                    margin-top: 50px;
                    display: flex;
                    justify-content: space-around;
                    text-align: center;
                }
                .sign-box {
                    width: 40%;
                }
                .italic { font-style: italic; }
                .bold { font-weight: bold; }
                
                @media print {
                    @page { margin: 2cm; }
                    body { padding: 0; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="school-info">
                    SỞ GIÁO DỤC VÀ ĐÀO TẠO<br/>
                    TRƯỜNG ${schoolName.toUpperCase()}
                </div>
                <div class="nation-info">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>
                    <span style="text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span>
                </div>
            </div>

            <div class="title">PHIẾU BÁO CÁO HẠNH KIỂM</div>

            <div class="student-info">
                <p><span class="bold">Họ và tên học sinh:</span> ${student.fullName}</p>
                <p><span class="bold">Mã học sinh:</span> ${student.shortName || 'N/A'}</p>
                <p><span class="bold">Đánh giá chung Tháng ${reportMonth + 1}/${reportYear}:</span> Đạt <span class="bold">${currentMonthScore}</span> điểm - Xếp loại <span class="bold">${getConductRating(currentMonthScore)}</span></p>
            </div>

            <p class="bold text-decoration: underline;">Thống kê điểm Tuần (Tháng ${reportMonth + 1})</p>
            <table>
                <tr>
                    <th>Tuần 1 (Ngày 1-7)</th>
                    <th>Tuần 2 (Ngày 8-14)</th>
                    <th>Tuần 3 (Ngày 15-21)</th>
                    <th>Tuần 4 (Ngày 22+)</th>
                </tr>
                <tr>
                    <td>${w1}</td>
                    <td>${w2}</td>
                    <td>${w3}</td>
                    <td>${w4}</td>
                </tr>
            </table>

            <p class="bold">Chi tiết vi phạm trong tháng</p>
            <table>
                <tr>
                    <th style="width: 25%;">Thời gian</th>
                    <th style="width: 55%;" class="text-left">Nội dung</th>
                    <th style="width: 20%;">Điểm Trừ</th>
                </tr>
                ${penalties.length > 0 ? penalties.map(p => `
                    <tr>
                        <td>${p.date}</td>
                        <td class="text-left">${p.desc}</td>
                        <td style="color: red; font-weight: bold;">${p.score}</td>
                    </tr>
                `).join('') : `
                    <tr>
                        <td colspan="3" class="italic">Không ghi nhận vi phạm nào trong tháng.</td>
                    </tr>
                `}
            </table>

            <p class="bold text-decoration: underline;">Tổng Kết Năm Học</p>
            <table>
                <tr>
                    <th>Trung Bình HK 1</th>
                    <th>Trung Bình HK 2</th>
                    <th>TỔNG KẾT NĂM</th>
                    <th>Xếp Loại T.K</th>
                </tr>
                <tr>
                    <td>${sem1Avg}</td>
                    <td>${sem2Avg}</td>
                    <td class="bold">${yearAvg}</td>
                    <td class="bold">${getConductRating(yearAvg)}</td>
                </tr>
            </table>

            <div class="signatures">
                <div class="sign-box">
                    <p class="bold">Ý Kiến Phụ Huynh</p>
                    <p class="italic">(Ký và ghi rõ họ tên)</p>
                    <br/><br/><br/><br/>
                </div>
                <div class="sign-box">
                    <p>......, ngày ...... tháng ...... năm ......</p>
                    <p class="bold">Giáo Viên Chủ Nhiệm</p>
                    <br/><br/><br/><br/>
                </div>
            </div>

            <script>
                // Auto-print after fonts load
                setTimeout(() => {
                    window.print();
                    // Optional: window.close() after print if desired
                }, 500);
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
