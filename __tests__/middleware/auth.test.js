const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('JWT Authentication Middleware', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Clean up and create test user
    await User.destroy({ where: {}, force: true });
    
    const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword
    });

    // Generate valid token
    authToken = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  test('should access protected route with valid token', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.id).toBe(testUser.id);
  });

  test('should return 401 for missing token', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Access denied. No token provided.');
  });

  test('should return 401 for invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid token.');
  });

  test('should return 401 for expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Already expired
    );

    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid token.');
  });
});
