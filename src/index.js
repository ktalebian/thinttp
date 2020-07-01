const ThinTTPRequest = require('./lib/request');

const thinTTP = async (opts = {}) => {
  const url = typeof opts === 'string' ? opts : opts.url;
  if (!url) {
    throw new Error('Url option is required');
  }

  const req = new ThinTTPRequest(url, opts);
  const res = await req.make();

  if (res.response.headers.hasOwnProperty('location') && opts.followRedirect) {
    opts.url = new URL(res.response.headers.location, url).toString();
    return thinTTP(opts);
  }

  if (opts.parse === 'json') {
    return res.json();
  }
  if (opts.parse === 'text') {
    return res.text();
  }

  return res;
};

module.exports = thinTTP;
