const request = require('supertest');
const app = require('../../src/app');

describe('Global Error Handler Middleware', () => {
  test('should handle 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/non-existent-route')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Route not found');
  });

  test('should handle validation errors with proper format', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        // Invalid data to trigger validation error
        email: 'invalid-email'
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('type');
    expect(response.body.type).toBe('validation');
  });

  test('should include request ID in error responses', async () => {
    const response = await request(app)
      .get('/api/non-existent-route')
      .expect(404);

    expect(response.body).toHaveProperty('requestId');
    expect(typeof response.body.requestId).toBe('string');
  });

  test('should not expose stack traces in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/non-existent-route')
      .expect(404);

    expect(response.body).not.toHaveProperty('stack');
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});
