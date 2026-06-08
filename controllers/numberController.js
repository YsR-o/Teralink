const NumberModel = require('../models/Number');

// 1. جلب الأرقام (للعملاء ولوحة التحكم) مع الفلترة، البحث، والتقسيم لصفحات (Pagination)
exports.getNumbers = async (req, res) => {
    try {
        let { page = 1, limit = 12, search, category, prefix, sortBy } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        let query = {};

        // البحث برقم معين
        if (search) {
            query.number = { $regex: search, $options: 'i' }; 
        }

        // الفلترة حسب التصنيف
        if (category && category !== 'All') {
            query.category = category;
        }

        // الفلترة حسب مقدمة الرقم (050, 054, 056)
        if (prefix && prefix !== 'All') {
            query.number = { $regex: `^${prefix}`, $options: 'i' };
            if (search) {
                query.$and = [
                    { number: { $regex: `^${prefix}`, $options: 'i' } },
                    { number: { $regex: search, $options: 'i' } }
                ];
                delete query.number;
            }
        }

        // خيارات الترتيب (الأحدث، الأقدم، الترتيب حسب التصنيف)
        let sortOption = { createdAt: -1 };
        if (sortBy === 'oldest') sortOption = { createdAt: 1 };
        if (sortBy === 'category') sortOption = { category: 1 };

        const numbers = await NumberModel.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await NumberModel.countDocuments(query);

        res.json({
            success: true,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalNumbers: total,
            data: numbers
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. إضافة رقم بشكل فردي من خلال لوحة التحكم
exports.createNumber = async (req, res) => {
    try {
        let { number, category } = req.body;
        
        // تنظيف الرقم المدخل يدوياً من أي فراغات
        if (number) number = number.trim().replace(/\s+/g, '');

        const newNumber = await NumberModel.create({ number, category });
        res.status(201).json({ success: true, data: newNumber });
    } catch (err) {
        res.status(400).json({ success: false, message: 'الرقم موجود بالفعل أو البيانات غير صالحة' });
    }
};

// 3. حذف رقم معين بواسطة الـ ID
exports.deleteNumber = async (req, res) => {
    try {
        await NumberModel.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'تم حذف الرقم بنجاح' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// 4. المزامنة الذكية: سحب البيانات لحظياً من Google Sheets وتنظيفها وتخزينها
exports.syncWithCSV = async (req, res) => {
    try {
        const csvUrl = process.env.GOOGLE_SHEET_CSV_URL;
        if (!csvUrl) {
            return res.status(400).json({ success: false, message: 'رابط الـ CSV غير معرّف في ملف .env' });
        }

        // جلب نص الـ CSV من الرابط المنشور
        const response = await fetch(csvUrl);
        const csvText = await response.text();

        // تقسيم النص إلى أسطر منفصلة
        const lines = csvText.split(/\r?\n/);
        if (lines.length < 2) {
            return res.status(400).json({ success: false, message: 'ملف البيانات فارغ أو لا يحتوي على أسطر كافية' });
        }

        // قراءة السطر الأول لتحديد كشاف (Index) عمود رقم الهاتف وعمود التصنيف ديناميكياً
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const msisdnIndex = headers.indexOf('msisdn');
        const categoryIndex = headers.indexOf('category');

        // التحقق من مطابقة أسماء الأعمدة الأساسية
        if (msisdnIndex === -1 || categoryIndex === -1) {
            return res.status(400).json({ 
                success: false, 
                message: 'لم يتم العثور على الأعمدة الأساسية المسمّاة MSISDN أو Category في السطر الأول من الشيت.' 
            });
        }

        let insertedCount = 0;
        let skippedCount = 0;

        // الدوران على السطور بدءاً من السطر الثاني لتخطي العناوين
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // تخطي السطور الفارغة

            const columns = line.split(',');
            
            let numStr = columns[msisdnIndex] ? columns[msisdnIndex].trim() : '';
            let catStr = columns[categoryIndex] ? columns[categoryIndex].trim() : '';

            // تنظيف البيانات من علامات التنصيص، وإزالة كافة الفراغات تماماً لتجنب مشاكل العرض والتصفية
            numStr = numStr.replace(/['"]+/g, '').replace(/\s+/g, '');
            catStr = catStr.replace(/['"]+/g, '').trim();

            // إزالة مفتاح الدولة الدولي (971) أو (+971) في حال وجوده لإرجاع الصيغة المحلية الصحيحة
            if (numStr.startsWith('971')) {
                numStr = '0' + numStr.substring(3);
            } else if (numStr.startsWith('+971')) {
                numStr = '0' + numStr.substring(4);
            }

            // الفحص الصارم للصيغة المحلية: يجب أن يتكون من 10 خانات تماماً ويبدأ بالمقدمات الصحيحة (050, 054, 056)
            const isValidUAEFormat = /^(050|054|056)\d{7}$/.test(numStr);

            if (isValidUAEFormat && catStr) {
                // استخدام خاصية Upsert لتحديث البيانات إن وجدت أو إنشائها لضمان عدم تكرار الرقم
                await NumberModel.updateOne(
                    { number: numStr },
                    { $set: { number: numStr, category: catStr, createdAt: new Date() } },
                    { upsert: true }
                );
                insertedCount++;
            } else {
                skippedCount++; // تخطي الأسطر غير المطابقة للشروط أو الناقصة
            }
        }

        res.json({
            success: true,
            message: `تمت المزامنة بنجاح! تم قراءة الأعمدة بدقة، وتحديث/إضافة ${insertedCount} رقم مميز، وتخطي ${skippedCount} مدخل غير مطابق للمواصفات.`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'فشل الاتصال بجوجل شيت أو حدث خطأ أثناء معالجة البيانات.' });
    }
};