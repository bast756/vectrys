import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import helloRoutes from '../routes/hello.routes.js';

describe('Hello Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1', helloRoutes);
  });

  afterAll(() => {
    app = null;
  });

  describe('GET /api/v1/hello', () => {
    it('devrait retourner un message de succès', async () => {
      const response = await request(app)
        .get('/api/v1/hello')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'VECTRYS Night Builder fonctionne !'
      });
    });

    it('devrait avoir la propriété success à true', async () => {
      const response = await request(app)
        .get('/api/v1/hello');

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    it('devrait avoir la propriété message avec le bon contenu', async () => {
      const response = await request(app)
        .get('/api/v1/hello');

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('VECTRYS Night Builder fonctionne !');
    });

    it('devrait retourner un statut 200', async () => {
      const response = await request(app)
        .get('/api/v1/hello');

      expect(response.status).toBe(200);
    });

    it('devrait retourner du JSON', async () => {
      const response = await request(app)
        .get('/api/v1/hello');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
