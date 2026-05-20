import { GroupSession } from '../types';

function toLocalDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseLocalScheduledDate(value: string): Date | null {
  const [yearString, monthString, dayString] = value.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function isPastScheduledDate(scheduledDate: string, now = new Date()): boolean {
  const scheduled = parseLocalScheduledDate(scheduledDate);
  if (!scheduled) {
    return true;
  }

  return scheduled.getTime() < toLocalDateOnly(now).getTime();
}

export function isGroupSessionVisible(session: GroupSession, now = new Date()): boolean {
  if (session.status !== 'proposed') {
    return false;
  }

  return !isPastScheduledDate(session.scheduled_date, now);
}
