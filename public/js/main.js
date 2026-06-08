let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    fetchNumbers();

    // ربط مستمعي الأحداث للفلاتر والبحث لتحديث النتائج فوراً
    document.getElementById('searchInput').addEventListener('input', () => { currentPage = 1; fetchNumbers(); });
    document.getElementById('categorySelect').addEventListener('change', () => { currentPage = 1; fetchNumbers(); });
    document.getElementById('prefixSelect').addEventListener('change', () => { currentPage = 1; fetchNumbers(); });
    document.getElementById('sortSelect').addEventListener('change', () => { currentPage = 1; fetchNumbers(); });
});

async function fetchNumbers() {
    const search = document.getElementById('searchInput').value;
    const category = document.getElementById('categorySelect').value;
    const prefix = document.getElementById('prefixSelect').value;
    const sortBy = document.getElementById('sortSelect').value;

    const url = `/api/numbers?page=${currentPage}&search=${search}&category=${category}&prefix=${prefix}&sortBy=${sortBy}`;
    
    try {
        const res = await fetch(url);
        const result = await res.json();
        if (result.success) {
            renderNumbers(result.data);
            renderPagination(result.totalPages);
        }
    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

// دالة لتنسيق الأرقام لتسهيل قراءتها
function formatNumber(num) {
    if (num.length === 10) {
        return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return num;
}

function renderNumbers(numbers) {
    const container = document.getElementById('numbersContainer');
    container.innerHTML = '';

    if (numbers.length === 0) {
        container.innerHTML = `<div class="text-center text-muted my-5"><h4>لا توجد أرقام تطابق خيارات البحث الحالية</h4></div>`;
        return;
    }

    numbers.forEach(item => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6';
        card.innerHTML = `
            <div class="number-card p-4 text-center">
                <div class="mb-2">
                    <span class="badge badge-${item.category} px-3 py-1 fs-6 rounded-pill">${item.category}</span>
                </div>
                <div class="phone-display text-warning dir-ltr my-3">${formatNumber(item.number)}</div>
                <button class="btn btn-sm btn-outline-light w-100 mt-2" onclick="alert('سيتم إضافة تواصل الواتساب بالنسخة الثانية')">احجز الآن</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        container.appendChild(li);
    }
}

function changePage(page) {
    currentPage = page;
    fetchNumbers();
}