const token = localStorage.getItem('adminToken');
if (!token) { window.location.href = 'login.html'; }

document.addEventListener('DOMContentLoaded', () => {
    loadAdminNumbers();

    // حدث المزامنة الفورية من قوقل شيت
    document.getElementById('syncSheetBtn').addEventListener('click', async () => {
        const statusDiv = document.getElementById('syncStatus');
        const btn = document.getElementById('syncSheetBtn');
        
        btn.disabled = true;
        statusDiv.innerHTML = '<span class="text-info">جاري سحب وتنقية البيانات من Google Sheets... يرجى الانتظار</span>';

        try {
            const res = await fetch('/api/numbers/sync-csv', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            
            if (data.success) {
                statusDiv.innerHTML = `<div class="alert alert-success m-0">${data.message}</div>`;
                loadAdminNumbers(); // إعادة تحميل جدول العينة بالأسفل
            } else {
                statusDiv.innerHTML = `<div class="alert alert-danger m-0">فشل: ${data.message}</div>`;
            }
        } catch (err) {
            statusDiv.innerHTML = '<div class="alert alert-danger m-0">حدث خطأ في الاتصال بالسيرفر.</div>';
        } finally {
            btn.disabled = false;
        }
    });
});

async function loadAdminNumbers() {
    const res = await fetch('/api/numbers?limit=10');
    const data = await res.json();
    const tbody = document.getElementById('adminNumbersTable');
    tbody.innerHTML = '';

    if(data.success && data.data) {
        data.data.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><span dir="ltr" style="font-weight: bold; display: inline-block;">${item.number}</span></td>
        <td><span class="badge badge-${item.category}">${item.category}</span></td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="deleteNumber('${item._id}')">حذف</button>
        </td>
    `;
    tbody.appendChild(tr);
});
    }
}

async function deleteNumber(id) {
    if(confirm('هل أنت متأكد من حذف هذا الرقم؟')) {
        const res = await fetch(`/api/numbers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.success) {
            loadAdminNumbers();
        }
    }
}