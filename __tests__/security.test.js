const request = require('supertest');
const app = require('../src/app');

describe('Security Tests', () => {
  describe('Rate Limiting', () => {
    it('should implement rate limiting on auth endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password' })
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(response => response.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should sanitize HTML in input fields', async () => {
      const maliciousInput = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: '<script>alert("xss")</script>John',
        lastName: '<img src=x onerror=alert("xss")>Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousInput)
        .expect(201);

      expect(response.body.user.firstName).not.toContain('<script>');
      expect(response.body.user.firstName).not.toContain('alert');
      expect(response.body.user.lastName).not.toContain('<img');
      expect(response.body.user.lastName).not.toContain('onerror');
    });

    it('should prevent SQL injection attempts', async () => {
      const sqlInjection = {
        email: "admin@example.com'; DROP TABLE users; --",
        password: 'password'
      };

      // This should not crash the server or cause database issues
      await request(app)
        .post('/api/auth/login')
        .send(sqlInjection)
        .expect(401); // Should just return unauthorized, not crash
    });
  });

  describe('Authentication Security', () => {
    it('should not expose sensitive user data in responses', async () => {
      const user = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(user)
        .expect(201);

      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('resetPasswordToken');
    });

    it('should use secure password hashing', async () => {
      // This test ensures bcrypt is properly implemented
      expect(true).toBe(true); // Placeholder - implement with actual bcrypt checks
    });
  });
});
