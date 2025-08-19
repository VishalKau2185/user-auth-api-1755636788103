const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoint', () => {
  test('GET /api/health should return 200 with status OK', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'OK',
      timestamp: expect.any(String),
      environment: process.env.NODE_ENV || 'development'
    });
  });
});
