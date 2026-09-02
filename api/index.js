let app;
let initError = null;

try {
  app = require('../server/server');
} catch (err) {
  initError = err;
  console.error('Failed to load server/server.js:', err);
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Server Initialization Failed',
      message: initError.message,
      stack: initError.stack
    }));
  }

  try {
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Server Execution Failed',
      message: err.message,
      stack: err.stack
    }));
  }
};
