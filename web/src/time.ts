const pad = (n: number) => String(n).padStart(2, '0');
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 把 ISO 時間轉成 YYYY-MM-DD，用來把預約分組到每一天 */
export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** 顯示用的時間，例如 09:30 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 顯示用的日期，例如 11/16（一） */
export function formatDateLabel(key: string): string {
  const [, month, day] = key.split('-').map(Number);
  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay();
  return `${month}/${day}（${WEEKDAYS[weekday]}）`;
}

/** 從今天開始接下來 n 天的日期（YYYY-MM-DD） */
export function upcomingDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** 把畫面上選的日期（YYYY-MM-DD）與時間（HH:mm）組成 ISO 字串送給 API */
export function toIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}
