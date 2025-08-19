const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Authentication Flow Integration', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await User.destroy({ where: {}, force: true });
  });

  test('complete auth flow: register -> login -> access protected route', async () => {
    const userData = {
      name: 'Integration Test User',
      email: 'integration@example.com',
      password: 'SecurePass123!'
    };

    // Step 1: Register
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(registerResponse.body).toHaveProperty('token');
    const registerToken = registerResponse.body.token;

    // Step 2: Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('token');
    const loginToken = loginResponse.body.token;

    // Step 3: Access protected route with login token
    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${loginToken}`)
      .expect(200);

    expect(profileResponse.body.user.email).toBe(userData.email);
    expect(profileResponse.body.user.name).toBe(userData.name);

    // Verify both tokens work (register token should also work)
    const profileResponse2 = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${registerToken}`)
      .expect(200);

    expect(profileResponse2.body.user.email).toBe(userData.email);
  });

  test('rate limiting on auth endpoints', async () => {
    const userData = {
      name: 'Rate Test User',
      email: 'rate@example.com',
      password: 'SecurePass123!'
    };

    // First register should succeed
    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Rapid login attempts (simulating brute force)
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(
        request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: 'WrongPassword'
          })
      );
    }

    const responses = await Promise.all(promises);
    
    // Should have some rate-limited responses (429)
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
