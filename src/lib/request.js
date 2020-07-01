const { URL } = require('url');
const { createGunzip, createInflate } = require('zlib');
const httpRequest = require('http').request;
const httpsRequest = require('https').request;

const ThinTTPResponse = require('./response');
const qsStringify = require('./qs');

module.exports = class ThinTTPRequest {
  constructor(url, options = {}) {
    this.options = {
      data: null,
      dataType: 'json',
      headers: {},
      method: 'GET',
      timeout: null,
      responseBufferSize: 50 * 1000000, // 50 MB
      ...options,
      url: new URL(url),
    };
  }

  make() {
    return new Promise((resolve, reject) => {
      if (this.options.data) {
        if (this.options.dataType === 'json' && typeof this.options.data === 'object') {
          this.options.data = JSON.stringify(this.options.data);
        }
        if (this.options.dataType === 'form' && typeof this.options.data === 'object') {
          this.options.data = qsStringify(this.options.data);
        }

        if (!this.options.headers.hasOwnProperty('content-type')) {
          this.options.headers['content-type'] =
            this.options.dataType === 'json' ? 'application/json' : 'application/x-www-form-urlencoded';
        }

        if (!this.options.headers.hasOwnProperty('content-length')) {
          this.options.headers['content-length'] = Buffer.byteLength(this.options.data);
        }
      }

      const opts = {
        protocol: this.options.url.protocol,
        host: this.options.url.hostname,
        port: this.options.url.port,
        path: this.options.url.pathname + (this.options.url.search === null ? '' : this.options.url.search),
        method: this.options.method,
        headers: this.options.headers,
      };
      const req = (this.options.url.protocol === 'http:' ? httpRequest : httpsRequest)(opts, (httpResponse) => {
        let stream = httpResponse;
        if (httpResponse.headers['content-encoding'] === 'gzip') {
          stream = httpResponse.pipe(createGunzip());
        } else if (httpResponse.headers['content-encoding'] === 'deflate') {
          stream = httpResponse.pipe(createInflate());
        }

        const thinTTPRes = new ThinTTPResponse(httpResponse);
        stream.on('error', reject);
        stream.on('data', (chunk) => {
          if (
            this.options.responseBufferSize !== null &&
            thinTTPRes.body.length > this.options.responseBufferSize.maxBuffer
          ) {
            stream.destroy();
            reject(new Error(`Response is longer than acceptable buffer size ${thinTTPRes.body.length} bytes`));
          }

          thinTTPRes.addChunk(chunk);
        });
        stream.on('end', () => resolve(thinTTPRes));
      });

      req.on('error', reject);
      if (this.options.timeout) {
        req.setTimeout(this.options.timeout, () => {
          req.abort();
          reject(new Error('Request timed out'));
        });
      }
      if (this.options.data) {
        req.write(this.options.data);
      }
      req.end();
    });
  }
};
