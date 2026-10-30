export interface WeekdayItem {
  id: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  short: string;
  name: string;
}

export const WEEKDAYS: WeekdayItem[] = [
  { id: 1, short: 'B.e', name: 'Bazar ertəsi' },
  { id: 2, short: 'Ç.a', name: 'Çərşənbə axşamı' },
  { id: 3, short: 'Çər', name: 'Çərşənbə' },
  { id: 4, short: 'C.a', name: 'Cümə axşamı' },
  { id: 5, short: 'Cüm', name: 'Cümə' },
  { id: 6, short: 'Şən', name: 'Şənbə' },
  { id: 0, short: 'Baz', name: 'Bazar' },
];

export const SCHEDULE_PRESETS = [
  { label: '1-3-5 (B.e / Çər / Cüm)', days: [1, 3, 5] },
  { label: '2-4-6 (Ç.a / C.a / Şən)', days: [2, 4, 6] },
  { label: 'Həftəsonu (Şən / Baz)', days: [6, 0] },
  { label: 'Həftədə 2 gün (Çər / Şən)', days: [3, 6] },
];

/**
 * Parses existing schedule text (e.g. 'B.e / Çər / Cümə · 19:00 - 21:00') into day ids [1, 3, 5]
 */
export function parseScheduleDays(scheduleText: string | undefined): number[] {
  if (!scheduleText) return [1, 3, 5]; // Default to 1-3-5

  const lower = scheduleText.toLowerCase();
  const matchedDays: number[] = [];

  // Check each weekday in Azerbaijani
  if (lower.includes('b.e') || lower.includes('bazar ert') || lower.includes('mon')) matchedDays.push(1);
  if (lower.includes('ç.a') || lower.includes('çərşənbə axş') || lower.includes('tue')) matchedDays.push(2);
  if (lower.includes('çər') || lower.includes('wed')) {
    if (!matchedDays.includes(3)) matchedDays.push(3);
  }
  if (lower.includes('c.a') || lower.includes('cümə axş') || lower.includes('thu')) matchedDays.push(4);
  if (lower.includes('cüm') || lower.includes('cume') || lower.includes('fri')) {
    if (!matchedDays.includes(5)) matchedDays.push(5);
  }
  if (lower.includes('şən') || lower.includes('sen') || lower.includes('sat')) matchedDays.push(6);
  if (lower.includes('baz') || lower.includes('sun')) {
    if (!matchedDays.includes(0)) matchedDays.push(0);
  }

  return matchedDays.length > 0 ? matchedDays : [1, 3, 5];
}

/**
 * Builds standard schedule string from selected days and times
 */
export function buildScheduleString(
  lessonDays: number[],
  startTime: string = '19:00',
  endTime: string = '21:00'
): string {
  if (!lessonDays || lessonDays.length === 0) return 'Təyin edilməyib';

  // Sort by week order (1, 2, 3, 4, 5, 6, 0)
  const sorted = [...lessonDays].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  const daysText = sorted
    .map(d => WEEKDAYS.find(w => w.id === d)?.short || '')
    .filter(Boolean)
    .join(' / ');

  if (startTime && endTime) {
    return `${daysText} · ${startTime} - ${endTime}`;
  }
  return daysText;
}

/**
 * Generates all real lesson dates for a given month that match the group's lesson days
 * and fall within the group's [startDate, endDate] range.
 * 
 * @param groupStartDate 'YYYY-MM-DD'
 * @param groupEndDate 'YYYY-MM-DD' (optional)
 * @param lessonDays Array of day indices: 0 = Sunday, 1 = Monday, etc.
 * @param yearMonth 'YYYY-MM' (e.g. '2026-10')
 * @returns Sorted array of date strings 'YYYY-MM-DD'
 */
export function generateGroupLessonDates(
  groupStartDate: string | undefined,
  groupEndDate: string | undefined,
  lessonDays: number[],
  yearMonth: string
): string[] {
  if (!lessonDays || lessonDays.length === 0) return [];

  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month)) return [];

  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${yearMonth}-${dayStr}`;

    // Respect group start and end date
    if (groupStartDate && dateStr < groupStartDate) {
      continue;
    }
    if (groupEndDate && dateStr > groupEndDate) {
      continue;
    }

    // JS Date month is 0-indexed (0 = Jan, 11 = Dec)
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (lessonDays.includes(dayOfWeek)) {
      dates.push(dateStr);
    }
  }

  return dates;
}

/**
 * Formats YYYY-MM to Azerbaijani title (e.g. '2026-10' -> 'Oktyabr 2026')
 */
export function formatYearMonthAz(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const monthsAz: Record<string, string> = {
    '01': 'Yanvar',
    '02': 'Fevral',
    '03': 'Mart',
    '04': 'Aprel',
    '05': 'May',
    '06': 'İyun',
    '07': 'İyul',
    '08': 'Avqust',
    '09': 'Sentyabr',
    '10': 'Oktyabr',
    '11': 'Noyabr',
    '12': 'Dekabr',
  };

  const name = monthsAz[month] || month;
  return `${name} ${year}`;
}
