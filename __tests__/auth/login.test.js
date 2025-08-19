const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Clean up and create test user
    await User.destroy({ where: {}, force: true });
    
    const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword
    });
  });

  test('should login with valid credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(loginData.email);
    expect(response.body.user).not.toHaveProperty('password');
  });

  test('should return 400 for missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com'
        // Missing password
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 401 for invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid email or password');
  });

  test('should return 401 for invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword123!'
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Invalid email or password');
  });

  test('should return valid JWT token', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    const token = response.body.token;
    expect(token).toMatch(/^[A-Za-z0-9-_]+.[A-Za-z0-9-_]+.[A-Za-z0-9-_.+/=]*$/);
  });
});
