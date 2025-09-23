const mongoose = require("mongoose")
const {Schema}= mongoose

const addressSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  house_name: String,
  locality: String,
  city: String,
  state: String,
  country: String,
  pincode: String,
  phone_number: String,
  is_default: { type: Boolean, default: false }
});

const Address = mongoose.model("Address",addressSchema)

module.exports = Address