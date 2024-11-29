const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
    StudentID: { type: Number, required: true },
    Name: { type: String, required: true },
    Roll: { type: Number, required: true },
    Birthday: { type: Date },
    Address: { type: String },
});

module.exports = mongoose.model('Student', StudentSchema);
