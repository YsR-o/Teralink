const mongoose = require('mongoose');

const NumberSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true, // لمنع تكرار نفس الرقم في النظام
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Platinum', 'Gold', 'Silver', 'Bronze'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// إضافة الفهارس (Indexes) لتحسين أداء الاستعلام والبحث الجزئي والتصفية
NumberSchema.index({ number: 'text', category: 1 });

module.exports = mongoose.model('Number', NumberSchema);