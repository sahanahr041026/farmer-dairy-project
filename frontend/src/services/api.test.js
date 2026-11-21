import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, buildQuery, formatErrorDetail, UNAUTHORIZED_EVENT } from './api';

function mockResponse({ status = 200, body = {}, contentType = 'application/json', text } = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (h) => (h.toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => body,
    text: async () => text ?? '',
    blob: async () => new Blob([text ?? '']),
  };
}

describe('buildQuery', () => {
  it('drops empty values but keeps false and 0', () => {
    expect(buildQuery({ a: 1, b: '', c: undefined, d: null, e: false, f: 0 })).toBe('?a=1&e=false&f=0');
  });
  it('returns an empty string with no params and encodes values', () => {
    expect(buildQuery({})).toBe('');
    expect(buildQuery({ q: 'a b&c' })).toBe('?q=a+b%26c');
  });
});

describe('formatErrorDetail', () => {
  it('passes strings through and joins validation errors', () => {
    expect(formatErrorDetail('Nope')).toBe('Nope');
    const detail = [
      { loc: ['body', 'initial_pin'], msg: 'String should match pattern' },
      { loc: ['query', 'limit'], msg: 'Input should be <= 500' },
    ];
    expect(formatErrorDetail(detail)).toBe('initial_pin: String should match pattern; limit: Input should be <= 500');
  });
  it('returns null for empty detail', () => {
    expect(formatErrorDetail(undefined)).toBeNull();
  });
});

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('sends the session cookie and the CSRF header, and never an Authorization header', async () => {
    fetch.mockResolvedValue(mockResponse({ body: { ok: true } }));
    await api.getMe();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/me$/);
    expect(opts.credentials).toBe('include');
    expect(opts.headers['X-Requested-With']).toBe('dairysathi-web');
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it('only sets Content-Type when there is a body', async () => {
    fetch.mockResolvedValue(mockResponse());
    await api.getFarmers({ search: 'x' });
    expect(fetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
    await api.createFarmer({ full_name: 'A' });
    expect(fetch.mock.calls[1][1].headers['Content-Type']).toBe('application/json');
  });

  it('turns validation-error arrays into a readable message and keeps the status', async () => {
    fetch.mockResolvedValue(mockResponse({
      status: 422,
      body: { detail: [{ loc: ['body', 'quantity_litres'], msg: 'Input should be greater than 0' }] },
    }));
    await expect(api.recordCollection({})).rejects.toMatchObject({
      message: 'quantity_litres: Input should be greater than 0',
      status: 422,
    });
  });

  it('clears the cached profile and emits the unauthorized event on 401', async () => {
    localStorage.setItem('dairysathi_user', '{"role":"admin"}');
    const handler = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    fetch.mockResolvedValue(mockResponse({ status: 401, body: { detail: 'expired' } }));
    await expect(api.getFarmers()).rejects.toThrow('expired');
    window.removeEventListener(UNAUTHORIZED_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('dairysathi_user')).toBeNull();
  });

  it('does not treat a failed login as a session expiry', async () => {
    localStorage.setItem('dairysathi_user', 'keep');
    const handler = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    fetch.mockResolvedValue(mockResponse({ status: 401, body: { detail: 'bad credentials' } }));
    await expect(api.loginAdmin({})).rejects.toThrow('bad credentials');
    window.removeEventListener(UNAUTHORIZED_EVENT, handler);
    expect(handler).not.toHaveBeenCalled();
    expect(localStorage.getItem('dairysathi_user')).toBe('keep');
  });

  it('reports network failures with a friendly message', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.getMe()).rejects.toThrow('Network connection unavailable');
  });

  it('getCurrentRate resolves to null when no rule exists (404) but rethrows other errors', async () => {
    fetch.mockResolvedValueOnce(mockResponse({ status: 404, body: { detail: 'No rule' } }));
    await expect(api.getCurrentRate()).resolves.toBeNull();
    fetch.mockResolvedValueOnce(mockResponse({ status: 500, body: { detail: 'boom' } }));
    await expect(api.getCurrentRate()).rejects.toThrow('boom');
  });

  it('returns null for 204 and downloads CSV through an authenticated request', async () => {
    fetch.mockResolvedValueOnce(mockResponse({ status: 204 }));
    await expect(api.deleteCattle(1)).resolves.toBeNull();

    fetch.mockResolvedValueOnce(mockResponse({ contentType: 'text/csv', text: 'a,b' }));
    const createUrl = vi.fn(() => 'blob:x');
    vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await api.downloadCollectionsCsv('2026-01-01', '2026-01-31');
    expect(createUrl).toHaveBeenCalled();
    expect(fetch.mock.calls.at(-1)[0]).toMatch(/start_date=2026-01-01&end_date=2026-01-31/);
    expect(fetch.mock.calls.at(-1)[1].credentials).toBe('include');
  });
});
