module.exports = class ThinTTPResponse {
  constructor(httpResponse) {
    this.body = Buffer.alloc(0);
    this.response = httpResponse;
  }

  addChunk(chunk) {
    this.body = Buffer.concat([this.body, chunk]);
  }

  json() {
    return this.response.statusCode === 204 ? null : JSON.parse(this.body);
  }

  text() {
    return this.body.toString();
  }
};
