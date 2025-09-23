async function paginatehelper(model, options = {}) {
  try {
    let {
      page = 1,
      limit = 5,
      sort = "-createdAt", 
      filters = {},
      search = "",
      searchFields = [], 
      populate = "",
    } = options

    page = parseInt(page) || 1
    limit = parseInt(limit) || 10
    const skip = (page - 1) * limit
    let query = { ...filters }
   
    if (search && searchFields.length > 0) {
  query.$or = searchFields.map((field) => ({
    [field]: { $regex: escapeRegex(search), $options: "i" },
  }))
 }

    function escapeRegex(text) {return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}

    const totalDocuments = await model.countDocuments(query)
    
    let dataQuery = model.find(query).skip(skip).limit(limit).sort(sort)

    
    if (populate) {
      dataQuery = dataQuery.populate(populate)
    }

    const results = await dataQuery

    return {
      results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDocuments / limit),
        totalDocuments,
        limit,
      },
    };
  } catch (err) {
    throw new Error("Query Helper Error: " + err.message)
  }
}

module.exports = paginatehelper
