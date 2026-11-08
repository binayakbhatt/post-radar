// src/lib/exportExcel.js
export function exportDiaryToExcel(entries, mode, fallbackExecutiveName) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml +=
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Styles>\n';
  xml +=
    '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#B91C1C" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>\n';
  xml +=
    '<Style ss:ID="Cell"><Alignment ss:Vertical="Top"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>\n';
  xml += '</Styles>\n';
  xml += '<Worksheet ss:Name="Field Diary">\n<Table>\n';

  const headers = [
    'Date',
    'Executive',
    'Institution Name',
    'Category',
    'Phone',
    'Address',
    'Visit Status',
    'Visit Remark',
    'Diary Notes',
    'Next Follow-Up',
  ];
  xml +=
    '<Row>' +
    headers.map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`).join('') +
    '</Row>\n';

  entries.forEach((e) => {
    const dateStr = new Date((e.visited_at || Date.now() / 1000) * 1000).toLocaleDateString();
    const rowData = [
      dateStr,
      e.executive_name || fallbackExecutiveName,
      e.business_name || '',
      e.business_type || '',
      e.phone || '',
      e.address || '',
      e.is_visited ? 'Visited' : 'Pending',
      e.visit_remark || '',
      e.diary_details || '',
      e.next_follow_up_date || '',
    ];
    xml +=
      '<Row>' +
      rowData
        .map(
          (val) =>
            `<Cell ss:StyleID="Cell"><Data ss:Type="String">${String(val)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')}</Data></Cell>`
        )
        .join('') +
      '</Row>\n';
  });

  xml += '</Table>\n</Worksheet>\n</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Post_Radar_Field_Diary_${mode}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
