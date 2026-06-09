import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Экспорт данных таблицы в Excel
 * @param {Array} rows - Массив строк таблицы
 * @param {string} filename - Имя файла (без расширения)
 */
export function exportToExcel(rows, filename = 'table_export') {
  if (!rows || rows.length === 0) {
    console.warn('Нет данных для экспорта');
    return;
  }

  // Преобразуем данные в формат для Excel
  const data = rows.map((row) => ({
    Адрес: row.address || '—',
    Полигон: row.polygon || '—',
    Комнат: row.rooms ?? '—',
    'Площадь, м²': row.area ?? '—',
    Этаж: row.floor ?? '—',
    Год: row.buildYear ?? '—',
    Материал: row.material || '—',
    Цена: formatPrice(row.price),
    Прогноз: formatPrice(row.predictedPrice),
    'Отклонение, %': row.deviationPercent != null ? row.deviationPercent.toFixed(1) : '—',
    'Цена / м²': formatPricePerSqm(row.sqm),
    Источник: row.sourceLabel || '—',
    Статус: row.statusLabel || '—',
    Дата: row.publishedLabel || '—',
    'Изменение, %': row.priceChangePercent != null ? row.priceChangePercent.toFixed(1) : '—',
  }));

  // Создаем workbook и worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Настраиваем ширину колонок
  const colWidths = [
    { wch: 50 }, // Адрес
    { wch: 20 }, // Полигон
    { wch: 10 }, // Комнат
    { wch: 12 }, // Площадь
    { wch: 10 }, // Этаж
    { wch: 10 }, // Год
    { wch: 15 }, // Материал
    { wch: 15 }, // Цена
    { wch: 15 }, // Прогноз
    { wch: 12 }, // Отклонение
    { wch: 15 }, // Цена / м²
    { wch: 12 }, // Источник
    { wch: 15 }, // Статус
    { wch: 12 }, // Дата
    { wch: 12 }, // Изменение
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Квартиры');

  // Генерируем буфер и сохраняем
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Экспорт данных таблицы в CSV
 * @param {Array} rows - Массив строк таблицы
 * @param {string} filename - Имя файла (без расширения)
 */
export function exportToCSV(rows, filename = 'table_export') {
  if (!rows || rows.length === 0) {
    console.warn('Нет данных для экспорта');
    return;
  }

  // Преобразуем данные в формат для CSV
  const data = rows.map((row) => ({
    Адрес: row.address || '—',
    Полигон: row.polygon || '—',
    Комнат: row.rooms ?? '—',
    'Площадь, м²': row.area ?? '—',
    Этаж: row.floor ?? '—',
    Год: row.buildYear ?? '—',
    Материал: row.material || '—',
    Цена: formatPrice(row.price),
    Прогноз: formatPrice(row.predictedPrice),
    'Отклонение, %': row.deviationPercent != null ? row.deviationPercent.toFixed(1) : '—',
    'Цена / м²': formatPricePerSqm(row.sqm),
    Источник: row.sourceLabel || '—',
    Статус: row.statusLabel || '—',
    Дата: row.publishedLabel || '—',
    'Изменение, %': row.priceChangePercent != null ? row.priceChangePercent.toFixed(1) : '—',
  }));

  // Формируем CSV строку
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(';'), // Заголовки
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName];
          // Экранируем кавычки и оборачиваем в кавычки, если есть точка с запятой
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(';')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Форматирование цены
 */
function formatPrice(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

/**
 * Форматирование цены за м²
 */
function formatPricePerSqm(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('ru-RU')} ₽/м²`;
}
