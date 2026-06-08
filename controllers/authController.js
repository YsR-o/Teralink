const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // اختياري في حال تشفير الباسورد، هنا سنقارن مباشرة للمساحة المحددة

exports.login = (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ success: true, token });
    }

    return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
};