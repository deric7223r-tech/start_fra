import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

// ── Mocks ──────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks/useAuth');

const mockedUseAuth = vi.mocked(useAuth);

// ── Helpers ────────────────────────────────────────────────

function makeUser(overrides?: Record<string, unknown>) {
  return {
    userId: 'u-1',
    email: 'alice@example.com',
    name: 'Alice Smith',
    role: 'employee',
    organisationId: 'org-1',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeProfile(overrides?: Record<string, unknown>) {
  return {
    id: 'p-1',
    user_id: 'u-1',
    full_name: 'Alice Smith',
    organization_name: 'Test Organisation',
    sector: 'public' as const,
    job_title: 'Finance Director',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function setupAuth(overrides?: Record<string, unknown>) {
  mockedUseAuth.mockReturnValue({
    user: makeUser(),
    profile: makeProfile(),
    roles: ['participant'] as never[],
    isLoading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    hasRole: vi.fn().mockReturnValue(false),
    refreshProfile: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>);
}

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

// ── Tests ──────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Header', () => {
  // ── Unauthenticated state ─────────────────────────

  describe('unauthenticated state', () => {
    beforeEach(() => {
      setupAuth({ user: null, profile: null });
    });

    it('shows Sign In link pointing to /auth', () => {
      renderHeader();

      const link = screen.getByRole('link', { name: 'Sign In' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/auth');
    });

    it('shows Get Started link pointing to /auth?mode=signup', () => {
      renderHeader();

      const link = screen.getByRole('link', { name: 'Get Started' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/auth?mode=signup');
    });

    it('does not render the user menu button', () => {
      renderHeader();

      expect(screen.queryByRole('button', { name: 'User menu' })).not.toBeInTheDocument();
    });
  });

  // ── Authenticated — participant ───────────────────

  describe('authenticated — participant role', () => {
    beforeEach(() => {
      setupAuth();
    });

    it('shows user avatar with initials from full_name', () => {
      renderHeader();

      expect(screen.getByText('AS')).toBeInTheDocument();
    });

    it('does not show Organisation nav button', () => {
      renderHeader();

      // The nav-level button (not dropdown items)
      const orgLinks = screen.queryAllByRole('link', { name: 'Organisation' });
      expect(orgLinks).toHaveLength(0);
    });

    it('does not show Facilitator Dashboard nav button', () => {
      renderHeader();

      expect(screen.queryByRole('link', { name: 'Facilitator Dashboard' })).not.toBeInTheDocument();
    });

    it('dropdown shows user name and email', async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole('button', { name: 'User menu' }));

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  // ── Authenticated — employer ──────────────────────

  describe('authenticated — employer role', () => {
    beforeEach(() => {
      setupAuth({ user: makeUser({ role: 'employer' }) });
    });

    it('shows Organisation nav button linking to /employer', () => {
      renderHeader();

      const links = screen.getAllByRole('link', { name: 'Organisation' });
      // At least the nav-level button
      const navLink = links.find(l => l.getAttribute('href') === '/employer');
      expect(navLink).toBeDefined();
    });

    it('dropdown menu includes Organisation link', async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole('button', { name: 'User menu' }));

      const orgLinks = screen.getAllByRole('menuitem').filter(
        el => el.textContent === 'Organisation',
      );
      expect(orgLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Authenticated — facilitator ───────────────────

  describe('authenticated — facilitator role', () => {
    it('shows Facilitator Dashboard nav button linking to /facilitator', () => {
      setupAuth({
        hasRole: vi.fn((role: string) => role === 'facilitator' || role === 'admin'),
      });

      renderHeader();

      const link = screen.getByRole('link', { name: 'Facilitator Dashboard' });
      expect(link).toHaveAttribute('href', '/facilitator');
    });
  });

  // ── Authenticated — admin ─────────────────────────

  describe('authenticated — admin role', () => {
    beforeEach(() => {
      setupAuth({
        user: makeUser({ role: 'admin' }),
        hasRole: vi.fn((role: string) => role === 'facilitator' || role === 'admin'),
      });
    });

    it('shows both Organisation and Facilitator Dashboard buttons', () => {
      renderHeader();

      expect(screen.getAllByRole('link', { name: 'Organisation' }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('link', { name: 'Facilitator Dashboard' })).toBeInTheDocument();
    });

    it('dropdown menu includes Organisation link', async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole('button', { name: 'User menu' }));

      const orgItems = screen.getAllByRole('menuitem').filter(
        el => el.textContent === 'Organisation',
      );
      expect(orgItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Sign-out flow ─────────────────────────────────

  describe('sign-out flow', () => {
    it('clicking Sign out calls signOut and navigates to /', async () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      setupAuth({ signOut: mockSignOut });

      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole('button', { name: 'User menu' }));
      await user.click(screen.getByText('Sign out'));

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // ── Initials generation ───────────────────────────

  describe('initials generation', () => {
    it('derives two-letter initials from two-word name', () => {
      setupAuth({ profile: makeProfile({ full_name: 'Bob Jones' }) });

      renderHeader();

      expect(screen.getByText('BJ')).toBeInTheDocument();
    });

    it('falls back to User icon when full_name is null', () => {
      setupAuth({ profile: makeProfile({ full_name: null }) });

      renderHeader();

      // No initials text, but the avatar button should still render
      expect(screen.queryByText('AS')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
    });
  });
});
