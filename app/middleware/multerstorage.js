const multer = require('multer')
const storage = multer.memoryStorage()
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('Only image files are allowed!'), false)
    }
}
module.exports = multer({ storage: storage, fileFilter: fileFilter })