import request from 'supertest';
import app from '../app';

describe('Server Basic Routes & Health Check', () => {
  it('GET /api/health should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /api/auth/login with empty body should return 401/400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
