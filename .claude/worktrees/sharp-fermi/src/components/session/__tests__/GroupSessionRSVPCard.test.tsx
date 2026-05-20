import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GroupSessionRSVPCard from '../GroupSessionRSVPCard';
import { GroupSession, GroupSessionRsvp } from '../../../types';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const baseSession: GroupSession = {
  id: 'session-1',
  group_chat_id: 'group-1',
  proposed_by: 'user-other',
  scheduled_date: '2026-03-16',
  status: 'proposed',
  created_at: '2026-03-15T00:00:00Z',
  updated_at: '2026-03-15T00:00:00Z',
};

function makeRsvp(userId: string, response: 'yes' | 'no'): GroupSessionRsvp {
  return {
    id: userId,
    group_session_id: 'session-1',
    user_id: userId,
    response,
    created_at: '',
    updated_at: '',
  };
}

const defaultProps = {
  session: baseSession,
  rsvps: [],
  memberCount: 4,
  currentUserId: 'user-me',
  proposedByName: 'Alex',
  onRsvp: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Smoke test ───────────────────────────────────────────────────────────────

it('renders without crashing (proposed, no rsvps)', () => {
  render(<GroupSessionRSVPCard {...defaultProps} />);
});

it('returns null for cancelled session', () => {
  const { toJSON } = render(
    <GroupSessionRSVPCard
      {...defaultProps}
      session={{ ...baseSession, status: 'cancelled' }}
    />
  );
  expect(toJSON()).toBeNull();
});

// ── formatDateLabel (tested via rendered meta line) ──────────────────────────

describe('meta line date format', () => {
  // '2026-03-16' is a Monday
  it('uses short weekday — shows "Mon,"', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(getByText(/Mon,/)).toBeTruthy();
  });

  it('does NOT show full weekday "Monday,"', () => {
    const { queryByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(queryByText(/Monday,/)).toBeNull();
  });
});

// ── count line ───────────────────────────────────────────────────────────────

describe('count line', () => {
  it('two-segment when no one has declined', () => {
    const { getByText } = render(
      <GroupSessionRSVPCard
        {...defaultProps}
        rsvps={[makeRsvp('user-a', 'yes')]}
        memberCount={4}
      />
    );
    expect(getByText("1 going · 3 haven't replied")).toBeTruthy();
  });

  it('three-segment when at least one person declined', () => {
    const { getByText } = render(
      <GroupSessionRSVPCard
        {...defaultProps}
        rsvps={[makeRsvp('user-a', 'yes'), makeRsvp('user-b', 'no')]}
        memberCount={4}
      />
    );
    expect(getByText('1 going · 1 not going · 2 pending')).toBeTruthy();
  });

  it('count line is absent in completed state', () => {
    const { queryByText } = render(
      <GroupSessionRSVPCard
        {...defaultProps}
        session={{ ...baseSession, status: 'completed' }}
      />
    );
    // Neither format should appear
    expect(queryByText(/going ·/)).toBeNull();
  });
});

// ── State 1: awaiting response ────────────────────────────────────────────────

describe('State 1 — awaiting response (no rsvp yet)', () => {
  it('shows "☕️ Count me in" and "Pass" buttons', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(getByText('☕️ Count me in')).toBeTruthy();
    expect(getByText('Pass')).toBeTruthy();
  });

  it('calls onRsvp("yes") when "Count me in" pressed', () => {
    const onRsvp = jest.fn();
    const { getByText } = render(
      <GroupSessionRSVPCard {...defaultProps} onRsvp={onRsvp} />
    );
    fireEvent.press(getByText('☕️ Count me in'));
    expect(onRsvp).toHaveBeenCalledWith('yes');
  });

  it('calls onRsvp("no") when "Pass" pressed', () => {
    const onRsvp = jest.fn();
    const { getByText } = render(
      <GroupSessionRSVPCard {...defaultProps} onRsvp={onRsvp} />
    );
    fireEvent.press(getByText('Pass'));
    expect(onRsvp).toHaveBeenCalledWith('no');
  });

  it('shows PENDING badge', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(getByText('PENDING')).toBeTruthy();
  });

  it('shows "Group Session" title', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(getByText('Group Session')).toBeTruthy();
  });

  it('shows proposer name in meta', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(getByText(/Alex proposed/)).toBeTruthy();
  });

  it('shows "You proposed" when currentUser is the proposer', () => {
    const { getByText } = render(
      <GroupSessionRSVPCard
        {...defaultProps}
        session={{ ...baseSession, proposed_by: 'user-me' }}
      />
    );
    expect(getByText(/You proposed/)).toBeTruthy();
  });
});

// ── State 2: responded yes ────────────────────────────────────────────────────

describe('State 2 — responded yes', () => {
  const props = {
    ...defaultProps,
    rsvps: [makeRsvp('user-me', 'yes')],
  };

  it('shows "You\'re going" label', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText("You're going")).toBeTruthy();
  });

  it('shows "Change" link', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText('Change')).toBeTruthy();
  });

  it('does NOT show action buttons', () => {
    const { queryByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(queryByText('☕️ Count me in')).toBeNull();
    expect(queryByText('Pass')).toBeNull();
  });

  it('tapping Change reveals action buttons', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    fireEvent.press(getByText('Change'));
    expect(getByText('☕️ Count me in')).toBeTruthy();
    expect(getByText('Pass')).toBeTruthy();
  });

  it('after tapping Change then Count me in, calls onRsvp("yes") and hides buttons', () => {
    const onRsvp = jest.fn();
    const { getByText, queryByText } = render(
      <GroupSessionRSVPCard {...props} onRsvp={onRsvp} />
    );
    fireEvent.press(getByText('Change'));
    fireEvent.press(getByText('☕️ Count me in'));
    expect(onRsvp).toHaveBeenCalledWith('yes');
    expect(queryByText('☕️ Count me in')).toBeNull();
  });

  it('after tapping Change then Pass, calls onRsvp("no") and hides buttons', () => {
    const onRsvp = jest.fn();
    const { getByText, queryByText } = render(
      <GroupSessionRSVPCard {...props} onRsvp={onRsvp} />
    );
    fireEvent.press(getByText('Change'));
    fireEvent.press(getByText('Pass'));
    expect(onRsvp).toHaveBeenCalledWith('no');
    expect(queryByText('Pass')).toBeNull();
  });
});

// ── State 3a: responded no, non-proposer ────────────────────────────────────

describe('State 3a — responded no, non-proposer', () => {
  const props = {
    ...defaultProps,
    rsvps: [makeRsvp('user-me', 'no')],
    // proposed_by: 'user-other' (default) — not the currentUser
  };

  it('shows "Can\'t make it" label', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText("Can't make it")).toBeTruthy();
  });

  it('shows "Change" link (not "Cancel")', () => {
    const { getByText, queryByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText('Change')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('tapping Change reveals action buttons', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    fireEvent.press(getByText('Change'));
    expect(getByText('☕️ Count me in')).toBeTruthy();
  });
});

// ── State 3b: responded no, proposer ─────────────────────────────────────────

describe('State 3b — responded no, proposer', () => {
  const props = {
    ...defaultProps,
    session: { ...baseSession, proposed_by: 'user-me' },
    rsvps: [makeRsvp('user-me', 'no')],
  };

  it('shows "Can\'t make it" label', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText("Can't make it")).toBeTruthy();
  });

  it('shows "Cancel" link (not "Change")', () => {
    const { getByText, queryByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText('Cancel')).toBeTruthy();
    expect(queryByText('Change')).toBeNull();
  });

  it('tapping Cancel calls onCancel', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <GroupSessionRSVPCard {...props} onCancel={onCancel} />
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ── Touch targets ─────────────────────────────────────────────────────────────

describe('touch targets', () => {
  it('"Pass" button has minHeight 44', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    // getByText returns the inner host Text node; .parent is the composite Text
    // wrapper; .parent.parent is the host View inside TouchableOpacity with the style
    expect(getByText('Pass').parent?.parent).toHaveStyle({ minHeight: 44 });
  });

  it('"Cancel" link has minHeight 44', () => {
    const props = {
      ...defaultProps,
      session: { ...baseSession, proposed_by: 'user-me' },
      rsvps: [makeRsvp('user-me', 'no')],
    };
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText('Cancel').parent?.parent).toHaveStyle({ minHeight: 44 });
  });
});

// ── State 4: completed ────────────────────────────────────────────────────────

describe('State 4 — completed', () => {
  const props = {
    ...defaultProps,
    session: { ...baseSession, status: 'completed' as const },
  };

  it('shows CONFIRMED badge', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText('CONFIRMED')).toBeTruthy();
  });

  it('shows "Session confirmed" label', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(getByText('Session confirmed')).toBeTruthy();
  });

  it('does NOT show action buttons', () => {
    const { queryByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(queryByText('☕️ Count me in')).toBeNull();
    expect(queryByText('Pass')).toBeNull();
  });

  it('does NOT show Change or Cancel', () => {
    const { queryByText } = render(<GroupSessionRSVPCard {...props} />);
    expect(queryByText('Change')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });
});
