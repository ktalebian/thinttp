const primitive = (v) => {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = (obj) => {
  if (obj === null) {
    return '';
  }

  if (typeof obj !== 'object') {
    return encodeURIComponent(primitive(obj));
  }

  return Object.keys(obj)
    .map((k) => {
      const ks = `${encodeURIComponent(primitive(k))}=`;
      if (Array.isArray(obj[k])) {
        return obj[k].map((v) => ks + encodeURIComponent(primitive(v))).join('&');
      }

      return ks + encodeURIComponent(primitive(obj[k]));
    })
    .filter(Boolean)
    .join('&');
};
