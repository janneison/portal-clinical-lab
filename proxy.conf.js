const BACKEND = 'http://host.docker.internal:8080';

const base = {
  target: BACKEND,
  secure: false,
  changeOrigin: true,
  logLevel: 'debug',
};

module.exports = [
  // Patient portal — preserve Authorization header explicitly
  {
    context: ['/patient-portal'],
    ...base,
    onProxyReq(proxyReq, req) {
      const auth = req.headers['authorization'];
      if (auth) {
        proxyReq.setHeader('Authorization', auth);
      }
    },
  },
  // All other API routes
  {
    context: ['/auth', '/orders', '/results', '/aliados', '/bacteriologos', '/exam-types', '/health-centers', '/patients', '/medicos'],
    ...base,
  },
];
