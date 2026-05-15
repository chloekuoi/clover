import { SessionRecord } from '../types';

function toLocalDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseLocalDate(value: string): Date | null {
  const [yearString, monthString, dayString] = value.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function getSessionScheduledDate(session: SessionRecord): string {
  return session.scheduled_date || session.session_date;
}

export function isPastSessionDate(session: SessionRecord, now = new Date()): boolean {
  const scheduled = parseLocalDate(getSessionScheduledDate(session));
  if (!scheduled) {
    return true;
  }

  return scheduled.getTime() < toLocalDateOnly(now).getTime();
}

export function isSessionVisible(session: SessionRecord, now = new Date()): boolean {
  if (session.status !== 'pending' && session.status !== 'active') {
    return false;
  }

  return !isPastSessionDate(session, now);
}
