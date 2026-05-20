import { SessionRecord } from '../../../types';
import { getSessionScheduledDate, isPastSessionDate, isSessionVisible } from '../../../services/sessionVisibility';

const baseSession: SessionRecord = {
  id: 'session-1',
  match_id: 'match-1',
  initiated_by: 'user-1',
  status: 'pending',
  session_date: '2099-03-16',
  scheduled_date: '2099-03-16',
  accepted_at: null,
  completed_at: null,
  completed_ack: null,
  locked_by_initiator_at: null,
  locked_by_invitee_at: null,
  created_at: '2099-03-15T00:00:00Z',
  updated_at: '2099-03-15T00:00:00Z',
};

describe('sessionVisibility', () => {
  it('uses scheduled_date when present', () => {
    expect(getSessionScheduledDate(baseSession)).toBe('2099-03-16');
  });

  it('falls back to session_date when scheduled_date is missing', () => {
    expect(getSessionScheduledDate({ ...baseSession, scheduled_date: undefined })).toBe('2099-03-16');
  });

  it('returns false for a future pending session', () => {
    expect(isPastSessionDate(baseSession, new Date(2099, 2, 15))).toBe(false);
  });

  it('returns true for a past session date', () => {
    expect(isPastSessionDate(baseSession, new Date(2099, 2, 17))).toBe(true);
  });

  it('shows a pending session on its scheduled day', () => {
    expect(isSessionVisible(baseSession, new Date(2099, 2, 16))).toBe(true);
  });

  it('shows an active session before the scheduled date passes', () => {
    expect(
      isSessionVisible({ ...baseSession, status: 'active' }, new Date(2099, 2, 16))
    ).toBe(true);
  });

  it('hides a pending session after the date has passed', () => {
    expect(isSessionVisible(baseSession, new Date(2099, 2, 17))).toBe(false);
  });

  it('hides an active session after the date has passed', () => {
    expect(
      isSessionVisible({ ...baseSession, status: 'active' }, new Date(2099, 2, 17))
    ).toBe(false);
  });

  it('hides declined sessions', () => {
    expect(
      isSessionVisible({ ...baseSession, status: 'declined' }, new Date(2099, 2, 16))
    ).toBe(false);
  });

  it('hides completed sessions', () => {
    expect(
      isSessionVisible({ ...baseSession, status: 'completed' }, new Date(2099, 2, 16))
    ).toBe(false);
  });

  it('hides cancelled sessions', () => {
    expect(
      isSessionVisible({ ...baseSession, status: 'cancelled' }, new Date(2099, 2, 16))
    ).toBe(false);
  });
});
