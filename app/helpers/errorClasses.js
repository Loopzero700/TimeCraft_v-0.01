class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    if (process.env.NODE_ENV === 'development') {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404)
  }
}

module.exports = { 
    AppError,
    NotFoundError 
}