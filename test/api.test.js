const request = require('supertest');
const app = require('../server');

describe('GET message history test', () => {
    it('should respond with JSON and 200', async() => {
        const res = await request(app).get('/api/messages');
        expect(res.statusCode).toBe(200);
    });
});