// =============================================================================
// SECTION: CommunityPage Tests
// Tests challenge loading, join action, leaderboard, and tab switching.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockList, mockJoin, mockLeaderboard } = vi.hoisted(() => ({
  mockList:        vi.fn(),
  mockJoin:        vi.fn(),
  mockLeaderboard: vi.fn(),
}));

vi.mock('../services/api', () => ({
  challengesAPI: {
    list:        mockList,
    join:        mockJoin,
    leaderboard: mockLeaderboard,
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test' }, loading: false }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../components/layout/DashboardShell', () => ({
  default: ({ children }) => React.createElement('div', { 'data-testid': 'shell' }, children),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useLocation: () => ({ pathname: '/dashboard/community' }) };
});

import CommunityPage from '../pages/CommunityPage.jsx';

const mockChallenge = {
  id: 1,
  title: 'June Carbon Challenge',
  description: 'Log every activity this month.',
  category: 'general',
  start_date: '2026-06-01',
  end_date: '2026-06-30',
  participant_count: 42,
  avg_score_kg: '15.5',
  joined: false,
  my_score_kg: null,
};

function wrap() {
  return render(<MemoryRouter><CommunityPage /></MemoryRouter>);
}

describe('CommunityPage', () => {
  beforeEach(() => {
    mockList.mockReset();
    mockJoin.mockReset();
    mockLeaderboard.mockReset();
    mockLeaderboard.mockResolvedValue({ data: { leaderboard: [], myRank: null }, error: null });
  });

  it('renders page heading', async () => {
    mockList.mockResolvedValue({ data: [], error: null });
    wrap();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^community$/i })).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while fetching challenges', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    wrap();
    const skeleton = screen.getByRole('status', { name: /loading challenges/i });
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('shows empty state when no challenges', async () => {
    mockList.mockResolvedValue({ data: [], error: null });
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/no active challenges/i)).toBeInTheDocument();
    });
  });

  it('renders challenge cards when challenges exist', async () => {
    mockList.mockResolvedValue({ data: [mockChallenge], error: null });
    wrap();
    await waitFor(() => {
      expect(screen.getByText('June Carbon Challenge')).toBeInTheDocument();
    });
  });

  it('shows Join Challenge button for unjoined challenges', async () => {
    mockList.mockResolvedValue({ data: [mockChallenge], error: null });
    wrap();
    await waitFor(() => screen.getByText('June Carbon Challenge'));
    expect(screen.getByRole('button', { name: /join challenge/i })).toBeInTheDocument();
  });

  it('calls challengesAPI.join when Join clicked', async () => {
    mockJoin.mockResolvedValue({ data: { message: 'Joined.' }, error: null });
    mockList.mockResolvedValue({ data: [mockChallenge], error: null });
    wrap();
    await waitFor(() => screen.getByRole('button', { name: /join challenge/i }));
    fireEvent.click(screen.getByRole('button', { name: /join challenge/i }));
    await waitFor(() => {
      expect(mockJoin).toHaveBeenCalledWith(1);
    });
  });

  it('shows Joined badge after joining', async () => {
    mockJoin.mockResolvedValue({ data: {}, error: null });
    mockList.mockResolvedValue({ data: [mockChallenge], error: null });
    wrap();
    await waitFor(() => screen.getByRole('button', { name: /join challenge/i }));
    fireEvent.click(screen.getByRole('button', { name: /join challenge/i }));
    await waitFor(() => {
      expect(screen.getByText(/joined/i)).toBeInTheDocument();
    });
  });

  it('shows error alert when API fails', async () => {
    mockList.mockResolvedValue({ data: null, error: 'Network error' });
    wrap();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('renders leaderboard section', async () => {
    mockList.mockResolvedValue({ data: [mockChallenge], error: null });
    wrap();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /leaderboard/i })).toBeInTheDocument();
    });
  });

  it('renders leaderboard entries from the API', async () => {
    mockList.mockResolvedValue({ data: [mockChallenge], error: null });
    mockLeaderboard.mockResolvedValue({
      data: { leaderboard: [
        { user_id: 1, first_name: 'Alice', score_kg: '50', rank: 1 },
      ], myRank: 1 },
      error: null,
    });
    wrap();
    await waitFor(() => screen.getByRole('heading', { name: /leaderboard/i }));
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });
});
