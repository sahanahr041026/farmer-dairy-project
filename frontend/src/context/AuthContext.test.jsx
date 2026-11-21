import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    api: {
      getMe: vi.fn(),
      logout: vi.fn(),
      loginAdmin: vi.fn(),
      loginFarmer: vi.fn(),
      setLanguage: vi.fn(),
    },
  };
});

import { api, UNAUTHORIZED_EVENT } from '../services/api';
import { AuthProvider, useAuth } from './AuthContext';

function Probe() {
  const { user, loading, loginAdmin, logout } = useAuth();
  return (
    <div>
      <span data-testid="state">{loading ? 'loading' : user ? `user:${user.name}` : 'anon'}</span>
      <button onClick={() => loginAdmin({ cooperative_code: 'C', username_or_email: 'a', password: 'p' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const renderProbe = () => render(<AuthProvider><Probe /></AuthProvider>);

describe('AuthProvider (cookie sessions)', () => {
  beforeEach(() => {
    api.getMe.mockReset();
    api.logout.mockReset().mockResolvedValue({});
    api.loginAdmin.mockReset();
  });

  it('does not call the API on startup when there is no cached profile', async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anon'));
    expect(api.getMe).not.toHaveBeenCalled();
  });

  it('restores the session from the cookie via /auth/me when a profile hint exists', async () => {
    localStorage.setItem('dairysathi_user', JSON.stringify({ role: 'admin', name: 'Old' }));
    api.getMe.mockResolvedValue({ role: 'admin', name: 'Fresh' });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('user:Fresh'));
  });

  it('drops the session when the server rejects it, but keeps it on a network error', async () => {
    localStorage.setItem('dairysathi_user', JSON.stringify({ role: 'admin', name: 'Old' }));
    api.getMe.mockRejectedValue(Object.assign(new Error('expired'), { status: 401 }));
    const { unmount } = renderProbe();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anon'));
    unmount();

    localStorage.setItem('dairysathi_user', JSON.stringify({ role: 'admin', name: 'Old' }));
    api.getMe.mockRejectedValue(new Error('Network connection unavailable'));
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('user:Old'));
  });

  it('logs in without ever storing a token in localStorage', async () => {
    api.loginAdmin.mockResolvedValue({
      access_token: 'SECRET.JWT.VALUE', user_id: 1, name: 'Admin', cooperative_id: 1,
      cooperative_name: 'Coop', cooperative_code: 'C',
    });
    renderProbe();
    await userEvent.click(await screen.findByText('login'));
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('user:Admin'));
    const stored = JSON.stringify(Object.entries(localStorage));
    expect(stored).not.toContain('SECRET.JWT.VALUE');
    expect(localStorage.getItem('dairysathi_token')).toBeNull();
  });

  it('logout calls the server and clears local state even if the call fails', async () => {
    localStorage.setItem('dairysathi_user', JSON.stringify({ role: 'admin', name: 'A' }));
    api.getMe.mockResolvedValue({ role: 'admin', name: 'A' });
    api.logout.mockRejectedValue(new Error('offline'));
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('user:A'));
    await userEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anon'));
    expect(api.logout).toHaveBeenCalled();
    expect(localStorage.getItem('dairysathi_user')).toBeNull();
  });

  it('reacts to the unauthorized event by signing the user out', async () => {
    localStorage.setItem('dairysathi_user', JSON.stringify({ role: 'admin', name: 'A' }));
    api.getMe.mockResolvedValue({ role: 'admin', name: 'A' });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('user:A'));
    act(() => { window.dispatchEvent(new Event(UNAUTHORIZED_EVENT)); });
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anon'));
  });
});
