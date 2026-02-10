import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import helloRouter from '../routes/hello.routes.js';

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/v1', helloRouter);
});

afterAll(() => {
  app = null;
});

describe('Hello Routes', () => {
  describe('GET /api/v1/hello', () => {
    it('devrait retourner un message de succès avec status 200', async () => {
      const response = await request(app)
        .get('/api/v1/hello')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('VECTRYS Night Builder fonctionne !');
    });

    it('devrait avoir la structure de réponse correcte', async () => {
      const response = await request(app)
        .get('/api/v1/hello')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
    });

    it('devrait retourner success: true', async () => {
      const response = await request(app)
        .get('/api/v1/hello')
        .expect(200);

      expect(response.body.success).toStrictEqual(true);
    });

    it('devrait retourner le message exact attendu', async () => {
      const response = await request(app)
        .get('/api/v1/hello')
        .expect(200);

      expect(response.body.message).toEqual('VECTRYS Night Builder fonctionne !');
    });

    it('devrait gérer plusieurs requêtes successives', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/v1/hello')
            .expect(200)
        );
      }

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('VECTRYS Night Builder fonctionne !');
      });
    });
  });

  describe('GET /api/v1/hello - Tests négatifs', () => {
    it('devrait retourner 404 pour une route inexistante', async () => {
      await request(app)
        .get('/api/v1/hello-world')
        .expect(404);
    });

    it('devrait retourner 404 pour /api/v1/hello/ avec slash final', async () => {
      await request(app)
        .get('/api/v1/hello/')
        .expect(404);
    });
  });

  describe('GET /api/v1/hello - Tests de méthodes HTTP', () => {
    it('devrait retourner 404 pour POST /api/v1/hello', async () => {
      await request(app)
        .post('/api/v1/hello')
        .expect(404);
    });

    it('devrait retourner 404 pour PUT /api/v1/hello', async () => {
      await request(app)
        .put('/api/v1/hello')
        .expect(404);
    });

    it('devrait retourner 404 pour DELETE /api/v1/hello', async () => {
      await request(app)
        .delete('/api/v1/hello')
        .expect(404);
    });

    it('devrait retourner 404 pour PATCH /api/v1/hello', async () => {
      await request(app)
        .patch('/api/v1/hello')
        .expect(404);
    });
  });
});
