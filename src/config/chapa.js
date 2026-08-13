module.exports = {
  secretKey: process.env.CHAPA_SECRET_KEY,
  publicKey: process.env.CHAPA_PUBLIC_KEY,
  baseUrl: process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
};
