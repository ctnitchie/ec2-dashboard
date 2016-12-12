import http from 'http';
import '../server/server.js';
import chai from 'chai';
chai.should();

describe('Express and React Starter Project', () => {
  it('should return 200', done => {
    http.get('http://localhost:3000', res => {
      res.statusCode.should.equal(200);
      done();
    });
  });
});
