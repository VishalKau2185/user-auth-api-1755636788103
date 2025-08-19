const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await User.destroy({ where: {}, force: true });
  });

  test('should register a new user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.name).toBe(userData.name);
    expect(response.body.user).not.toHaveProperty('password');
  });

  test('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com'
        // Missing name and password
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('validation');
  });

  test('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'SecurePass123!'
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 400 for weak password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: '123'
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('password');
  });

  test('should return 409 for duplicate email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!'
    };

    // First registration should succeed
    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Second registration with same email should fail
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(409);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('email');
  });

  test('should hash the password before storing', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    const user = await User.findOne({ where: { email: userData.email } });
    expect(user.password).not.toBe(userData.password);
    expect(user.password).toHaveLength(60); // bcrypt hash length
  });
});
