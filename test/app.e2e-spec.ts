import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /health - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('services');
          expect(res.body.services).toHaveProperty('database');
        });
    });
  });

  describe('Auth', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    let authToken: string;

    it('POST /auth/register - should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test User', email: testEmail, password: testPassword })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testEmail);
      authToken = res.body.token;
    });

    it('POST /auth/register - should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test User', email: testEmail, password: testPassword })
        .expect(409);
    });

    it('POST /auth/login - should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      authToken = res.body.token;
    });

    it('POST /auth/login - should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401);
    });

    it('GET /auth/me - should return current user with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testEmail);
    });

    it('GET /auth/me - should fail without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('POST /auth/logout - should succeed with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });
  });

  describe('Users', () => {
    const testEmail = `usertest-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    let authToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'User Test', email: testEmail, password: testPassword });
      authToken = res.body.token;
    });

    it('GET /users/me - should return user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testEmail);
        });
    });

    it('PATCH /users/me - should update user name', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.name).toBe('Updated Name');
        });
    });

    it('PATCH /users/me/password - should update password', () => {
      return request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: testPassword, newPassword: 'newpass456' })
        .expect(200);
    });

    it('PATCH /users/me/password - should fail with wrong current password', () => {
      return request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpass789' })
        .expect(401);
    });
  });

  describe('Favorites', () => {
    const testEmail = `favtest-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    let authToken: string;
    let favoriteId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Fav Test', email: testEmail, password: testPassword });
      authToken = res.body.token;
    });

    it('GET /favorites - should return empty array initially', async () => {
      const res = await request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('favorites');
      expect(Array.isArray(res.body.favorites)).toBe(true);
    });

    it('POST /favorites - should add a favorite city', async () => {
      const res = await request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 })
        .expect(201);

      expect(res.body).toHaveProperty('favorite');
      expect(res.body.favorite.name).toBe('Buenos Aires');
      favoriteId = res.body.favorite.cityId;
    });

    it('POST /favorites - should fail with duplicate', () => {
      return request(app.getHttpServer())
        .post('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 })
        .expect(409);
    });

    it('GET /favorites - should return one favorite', async () => {
      const res = await request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.favorites.length).toBe(1);
    });

    it('DELETE /favorites/:cityId - should remove a favorite', () => {
      return request(app.getHttpServer())
        .delete(`/favorites/${favoriteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('DELETE /favorites/:cityId - should fail with non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/favorites/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Preferences', () => {
    const testEmail = `preftest-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    let authToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Pref Test', email: testEmail, password: testPassword });
      authToken = res.body.token;
    });

    it('GET /preferences - should return default preferences', async () => {
      const res = await request(app.getHttpServer())
        .get('/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('preferences');
      expect(res.body.preferences).toHaveProperty('tempUnit');
      expect(res.body.preferences).toHaveProperty('windUnit');
      expect(res.body.preferences).toHaveProperty('language');
    });

    it('PATCH /preferences - should update preferences', async () => {
      const res = await request(app.getHttpServer())
        .patch('/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tempUnit: 'fahrenheit', language: 'en' })
        .expect(200);

      expect(res.body.preferences.tempUnit).toBe('fahrenheit');
      expect(res.body.preferences.language).toBe('en');
    });

    it('GET /preferences - should return updated preferences', async () => {
      const res = await request(app.getHttpServer())
        .get('/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.preferences.tempUnit).toBe('fahrenheit');
      expect(res.body.preferences.language).toBe('en');
    });
  });

  describe('Search History', () => {
    const testEmail = `histtest-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    let authToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'History Test', email: testEmail, password: testPassword });
      authToken = res.body.token;
    });

    it('GET /search-history - should return empty array initially', async () => {
      const res = await request(app.getHttpServer())
        .get('/search-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('history');
      expect(Array.isArray(res.body.history)).toBe(true);
    });

    it('POST /search-history - should add a search entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/search-history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 })
        .expect(201);

      expect(res.body).toHaveProperty('entry');
      expect(res.body.entry.name).toBe('London');
    });

    it('POST /search-history - should deduplicate existing entry', async () => {
      await request(app.getHttpServer())
        .post('/search-history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/search-history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 })
        .expect(201);

      expect(res.body.entry.name).toBe('London');
    });

    it('DELETE /search-history - should clear all history', async () => {
      await request(app.getHttpServer())
        .delete('/search-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get('/search-history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.history.length).toBe(0);
    });
  });

  describe('Validation', () => {
    it('POST /auth/register - should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: 'invalid', password: 'test123' })
        .expect(400);
    });

    it('POST /auth/register - should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: '123' })
        .expect(400);
    });

    it('GET /cities/search - should fail with short query', () => {
      return request(app.getHttpServer())
        .get('/cities/search')
        .query({ q: 'a' })
        .expect(400);
    });
  });
});
