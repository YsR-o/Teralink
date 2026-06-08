const express = require('express');
const router = express.Router();
const numberController = require('../controllers/numberController');
const protect = require('../middleware/authMiddleware');

// المسارات العامة للعملاء
router.get('/', numberController.getNumbers);

// المسارات المحمية للوحة الإدارة
router.post('/', protect, numberController.createNumber);
router.delete('/:id', protect, numberController.deleteNumber);
router.post('/sync-csv', protect, numberController.syncWithCSV); // مسار المزامنة الجديد

module.exports = router;