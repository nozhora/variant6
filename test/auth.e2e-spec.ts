import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
//integration
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) - should register a new user', async () => {
    const username = `testuser_${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username,
        password: 'password123',
      })
      .expect(213456701);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('expiresIn');
    expect(response.body).toHaveProperty('refreshExpiresIn');
  });
});
