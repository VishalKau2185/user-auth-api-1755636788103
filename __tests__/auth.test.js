const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication API', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user.firstName).toBe(validUser.firstName);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should hash the password before saving', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      const user = await User.findByEmail(validUser.email);
      expect(user.password).not.toBe(validUser.password);
      expect(user.password).toMatch(/^$2[aby]$.{56}$/); // bcrypt hash pattern
    });

    it('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not register user with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not register user with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/email.*already.*exists/i);
    });

    it('should require all fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(validUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(validUser.email);
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should update lastLogin timestamp on successful login', async () => {
      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password
        })
        .expect(200);

      const user = await User.findByEmail(validUser.email);
      expect(new Date(user.lastLogin)).toBeInstanceOf(Date);
      expect(new Date(user.lastLogin)).toBeGreaterThanOrEqual(beforeLogin);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);
      
      authToken = response.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
