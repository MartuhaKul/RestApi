import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { userRepository } from '../src/modules/users/user.repository';

const app = createApp();

const samplePayload = { name: 'Марта Кулеш', email: 'marta@example.com', age: 21 };

describe('Users API', () => {
  beforeEach(() => {
    userRepository.reset();
  });

  describe('POST /api/v1/users', () => {
    it('creates a user (201) and returns it', async () => {
      const res = await request(app).post('/api/v1/users').send(samplePayload);
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: samplePayload.name,
        email: samplePayload.email,
        age: samplePayload.age,
      });
      expect(res.body.data.id).toBeTruthy();
      expect(res.headers.location).toContain('/api/v1/users/');
    });

    it('rejects invalid payload (422)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .send({ name: 'A', email: 'not-an-email', age: -1 });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
      expect(res.body.error.details).toBeDefined();
    });

    it('rejects duplicate email (409)', async () => {
      await request(app).post('/api/v1/users').send(samplePayload);
      const res = await request(app).post('/api/v1/users').send(samplePayload);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/users', () => {
    it('returns paginated list', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/users')
          .send({ name: `User ${i}`, email: `user${i}@example.com`, age: 20 + i });
      }
      const res = await request(app).get('/api/v1/users?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('supports search filter', async () => {
      await request(app).post('/api/v1/users').send(samplePayload);
      await request(app)
        .post('/api/v1/users')
        .send({ name: 'Іван', email: 'ivan@example.com', age: 30 });
      const res = await request(app).get('/api/v1/users?search=marta');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe('marta@example.com');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('returns a single user', async () => {
      const created = await request(app).post('/api/v1/users').send(samplePayload);
      const res = await request(app).get(`/api/v1/users/${created.body.data.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(samplePayload.email);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).get('/api/v1/users/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 422 for invalid uuid', async () => {
      const res = await request(app).get('/api/v1/users/not-a-uuid');
      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('updates a user', async () => {
      const created = await request(app).post('/api/v1/users').send(samplePayload);
      const res = await request(app)
        .put(`/api/v1/users/${created.body.data.id}`)
        .send({ age: 25 });
      expect(res.status).toBe(200);
      expect(res.body.data.age).toBe(25);
      expect(res.body.data.updatedAt).not.toBe(created.body.data.updatedAt);
    });

    it('rejects empty body (422)', async () => {
      const created = await request(app).post('/api/v1/users').send(samplePayload);
      const res = await request(app).put(`/api/v1/users/${created.body.data.id}`).send({});
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('deletes a user (204)', async () => {
      const created = await request(app).post('/api/v1/users').send(samplePayload);
      const res = await request(app).delete(`/api/v1/users/${created.body.data.id}`);
      expect(res.status).toBe(204);

      const after = await request(app).get(`/api/v1/users/${created.body.data.id}`);
      expect(after.status).toBe(404);
    });
  });

  describe('GET /api/v1/health', () => {
    it('returns ok', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Unknown routes', () => {
    it('returns 404 with structured error', async () => {
      const res = await request(app).get('/api/v1/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
