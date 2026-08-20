function extractCsrfToken(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  if (!match) throw new Error('CSRF token not found in response HTML');
  return match[1];
}

module.exports = { extractCsrfToken };
