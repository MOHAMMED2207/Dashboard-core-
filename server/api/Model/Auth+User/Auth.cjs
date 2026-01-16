const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const userScheam = new Schema(
  {
    // this is the schema of the user collection in the database
    fullname: String,
    username: { type: String, unique: true },
    age: Number,
    country: String,
    city: String,
    address: String,
    Phone: { type: String, unique: true },
    email: { type: String, unique: true }, // unique: true means that the email must be unique
    Password: String,
    ProfileImg: String, // this is the profile image of the user
    CoverImg: String, // this is the cover image of the user
    bio: String,
    link: String, // this is the link of the user
    role: { type: String, default: "User" }, // this is the role of the user
    companyId: { type: Schema.Types.ObjectId, ref: "Company" }, // <--- جديد
  },
  { timestamps: true }
);

userScheam.methods.comparePassword = async function (Password) {
  // this.Password is the password in the database
  return await bcrypt.compare(Password, this.Password); // this.Password is the password in the database
};
module.exports = mongoose.model("auth", userScheam); // user is the name of the collection in the database
