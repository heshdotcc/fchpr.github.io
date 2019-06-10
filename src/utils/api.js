export function sendJson(res, json) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', `max-age=${5 * 60 * 1e3}`); // 5 minutes

  res.end(JSON.stringify(json));
}

export function notFound(res) {
  res.statusCode = 404;
  res.end(JSON.stringify({ message: 'not found' }));
}