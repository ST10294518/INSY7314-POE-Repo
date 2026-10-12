function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Malformed JSON in request body.',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request body exceeds the permitted size.',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Submitted data failed validation.',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid data format.',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'A record with these unique details already exists.',
    });
  }

  console.error(
    `[${new Date().toISOString()}] Unhandled request error.`
  );

  return res.status(500).json({
    message: 'An unexpected error occurred.',
  });
}

function notFound(req, res) {
  return res.status(404).json({
    message: 'Resource not found.',
  });
}

module.exports = { errorHandler, notFound };
