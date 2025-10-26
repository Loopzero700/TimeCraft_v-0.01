module.exports = (req, res, next) => {
  for (const key in req.params) {
    const value = req.params[key]
    if (value && !/^[a-fA-F0-9]{24}$/.test(value)) {
      return res.status(400).json({
        message: `Invalid '${key}' parameter. Must be a valid MongoDB ObjectId.`,
      })
    }
  }

  const { page, limit } = req.query
  if (page && isNaN(page)) {
    return res.status(400).json({ message: "Query param 'page' must be a number" })
  }
  if (limit && isNaN(limit)) {
    return res.status(400).json({ message: "Query param 'limit' must be a number" })
  }

  next()
}
