import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, loadSession, resetApiStateForTests } from './api';

type FetchArgs = [input: string, init: RequestInit];

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function headersOf(call: FetchArgs): Record<string, string> {
  return call[1].headers as Record<string, string>;
}

describe('api istemcisi', () => {
  const fetchMock = vi.fn<(...args: FetchArgs) => Promise<Response>>();

  beforeEach(() => {
    resetApiStateForTests();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET isteklerinde CSRF belirteci göndermez ve oturum istemez', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [{ slug: 'csharp' }]));

    const tracks = await api.get<{ slug: string }[]>('/tracks');

    expect(tracks).toEqual([{ slug: 'csharp' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/tracks');
    expect(headersOf(fetchMock.mock.calls[0])).not.toHaveProperty('X-CSRF-TOKEN');
  });

  it('durum değiştiren ilk istekten önce oturumu yükler ve belirteci başlığa ekler', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { csrfToken: 'token-1' }))
      .mockResolvedValueOnce(jsonResponse(204));

    await api.put('/tracks/a/lessons/b/progress', { completed: true });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/session');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
    expect(headersOf(fetchMock.mock.calls[1])['X-CSRF-TOKEN']).toBe('token-1');
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ completed: true }));
  });

  it('giriş yanıtındaki yeni belirteci sonraki isteklerde kullanır', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { csrfToken: 'anonim' }))
      .mockResolvedValueOnce(jsonResponse(200, { user: { id: '1' }, csrfToken: 'oturumlu' }))
      .mockResolvedValueOnce(jsonResponse(200, {}));

    await api.post('/auth/login', { email: 'a@b.c', password: 'x' });
    await api.post('/playground/run', { language: 'csharp', code: '' });

    expect(headersOf(fetchMock.mock.calls[1])['X-CSRF-TOKEN']).toBe('anonim');
    expect(headersOf(fetchMock.mock.calls[2])['X-CSRF-TOKEN']).toBe('oturumlu');
  });

  it('belirteç reddedilirse oturumu yenileyip isteği bir kez daha dener', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { csrfToken: 'eski' }))
      .mockResolvedValueOnce(jsonResponse(400, { title: 'Geçersiz belirteç', code: 'csrf_invalid' }))
      .mockResolvedValueOnce(jsonResponse(200, { csrfToken: 'yeni' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await api.post<{ ok: boolean }>('/auth/logout');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(headersOf(fetchMock.mock.calls[3])['X-CSRF-TOKEN']).toBe('yeni');
  });

  it('belirteç ikinci kez de reddedilirse sonsuz döngüye girmez', async () => {
    fetchMock.mockImplementation(async (input) =>
      input === '/api/auth/session' ? jsonResponse(200, { csrfToken: 't' }) : jsonResponse(400, { code: 'csrf_invalid' }),
    );

    await expect(api.post('/auth/logout')).rejects.toMatchObject({ status: 400, code: 'csrf_invalid' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('doğrulama hatalarını alan adlarını küçük harfe çevirerek taşır', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { csrfToken: 't' }))
      .mockResolvedValueOnce(jsonResponse(400, { title: 'Hata', errors: { Email: ['Geçersiz e-posta.'], DisplayName: ['Çok kısa.'] } }));

    const error = await api.post('/auth/register', {}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors).toEqual({ email: ['Geçersiz e-posta.'], displayname: ['Çok kısa.'] });
    expect((error as ApiError).message).toBe('Lütfen işaretli alanları düzeltin.');
  });

  it('sunucunun problem başlığını hata iletisi olarak kullanır, yoksa duruma göre varsayılan ileti verir', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(503, { title: 'Kod çalıştırma servisi şu anda yoğun.' }));
    await expect(api.get('/x')).rejects.toMatchObject({ status: 503, message: 'Kod çalıştırma servisi şu anda yoğun.' });

    fetchMock.mockResolvedValueOnce(jsonResponse(404));
    await expect(api.get('/y')).rejects.toMatchObject({ status: 404, message: 'Aradığınız içerik bulunamadı.' });
  });

  it('ağ hatasını anlaşılır bir ApiError olarak bildirir', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.get('/tracks')).rejects.toMatchObject({ status: 0 });
  });

  it('eşzamanlı oturum istekleri tek bir ağ isteğini paylaşır', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { csrfToken: 't' }));

    await Promise.all([loadSession(), loadSession(), loadSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
