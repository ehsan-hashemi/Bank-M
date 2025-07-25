function initializeApp() {
    updateDashboard();
    updateCustomerTable();
}

const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// مدیریت صفحات
document.getElementById('dashboard-link').addEventListener('click', () => showSection('dashboard'));
document.getElementById('create-account-link').addEventListener('click', () => showSection('create-account'));
document.getElementById('customers-link').addEventListener('click', () => showSection('customers'));
document.getElementById('transactions-link').addEventListener('click', () => showSection('transactions'));
document.getElementById('history-link').addEventListener('click', () => showSection('transaction-history-section'));
document.getElementById('cheques-link').addEventListener('click', () => showSection('cheques'));
document.getElementById('loans-link').addEventListener('click', () => showSection('loans'));

function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

// تولید شماره حساب تصادفی
function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// به‌روزرسانی localStorage
function saveToLocalStorage() {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ایجاد حساب جدید
document.getElementById('create-account-form').addEventListener('submit', event => {
    event.preventDefault();
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const phoneNumber = document.getElementById('phone-number').value;
    const citizenCode = document.getElementById('citizen-code').value;
    const initialBalance = parseFloat(document.getElementById('initial-balance').value);
    const accountNumber = generateAccountNumber();

    const account = { firstName, lastName, phoneNumber, citizenCode, accountNumber, balance: initialBalance };
    accounts.push(account);

    const date = new Date();
    transactions.push({
        accountNumber,
        amount: initialBalance,
        type: 'ایجاد حساب',
        date
    });

    saveToLocalStorage();
    updateDashboard();
    updateCustomerTable();
    alert('حساب با موفقیت ایجاد شد و تراکنش ثبت شد!');
    document.getElementById('create-account-form').reset();
});

// نمایش فیلد مقصد در انتقال وجه
document.getElementById('transaction-type').addEventListener('change', e => {
    const show = e.target.value === 'transfer';
    document.getElementById('destination-account-container').style.display = show ? 'block' : 'none';
});

// ثبت تراکنش‌ها (افزایش، کاهش، انتقال)
document.getElementById('transaction-form').addEventListener('submit', event => {
    event.preventDefault();
    const accNum = document.getElementById('account-number').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const type = document.getElementById('transaction-type').value;
    const date = new Date();

    const account = accounts.find(a => a.accountNumber === accNum);
    if (!account) {
        alert('حساب یافت نشد!');
        return;
    }

    if (type === 'withdraw') {
        if (account.balance < amount) {
            alert('موجودی کافی نیست!');
            return;
        }
        account.balance -= amount;
        transactions.push({ accountNumber: accNum, amount, type: 'کاهش', date });
    }
    else if (type === 'deposit') {
        account.balance += amount;
        transactions.push({ accountNumber: accNum, amount, type: 'افزایش', date });
    }
    else if (type === 'transfer') {
        const destNum = document.getElementById('destination-account').value;
        const destAcc = accounts.find(a => a.accountNumber === destNum);
        if (!destAcc) {
            alert('حساب مقصد یافت نشد!');
            return;
        }
        if (account.balance < amount) {
            alert('موجودی کافی نیست!');
            return;
        }
        account.balance -= amount;
        destAcc.balance += amount;

        transactions.push({
            accountNumber: accNum,
            amount,
            type: 'حساب به حساب',
            destination: destNum,
            date
        });
        transactions.push({
            accountNumber: destNum,
            amount,
            type: 'دریافت از حساب دیگر',
            source: accNum,
            date
        });
    }

    saveToLocalStorage();
    updateDashboard();
    updateCustomerTable();
    alert('تراکنش با موفقیت ثبت شد!');
    document.getElementById('transaction-form').reset();
    document.getElementById('destination-account-container').style.display = 'none';
});

// دکمه پاک کردن داده‌ها
const clearBtn = document.createElement('button');
clearBtn.innerText = 'پاک کردن تمام اطلاعات';
clearBtn.style.cssText = 'background:#e63946;color:#fff;padding:.5rem 1rem;border:none;cursor:pointer;margin-top:1rem;';
clearBtn.addEventListener('click', () => {
    if (confirm('آیا از پاک کردن همه داده‌ها مطمئنید؟')) {
        localStorage.clear();
        accounts.length = 0;
        transactions.length = 0;
        updateDashboard();
        updateCustomerTable();
        alert('تمام اطلاعات پاک شدند!');
    }
});
document.querySelector('main').appendChild(clearBtn);

// به‌روزرسانی داشبورد
function updateDashboard() {
    document.getElementById('customer-count').innerText = accounts.length;
    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    document.getElementById('total-balance').innerText = total.toLocaleString() + ' ریال';
}

// به‌روزرسانی جدول مشتریان
function updateCustomerTable(filtered = accounts) {
    const tbody = document.querySelector('#customers-table tbody');
    tbody.innerHTML = '';
    filtered.forEach((acc, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${acc.firstName}</td>
            <td>${acc.lastName}</td>
            <td>${acc.phoneNumber}</td>
            <td>${acc.citizenCode}</td>
            <td>${acc.accountNumber}</td>
            <td>${acc.balance.toLocaleString()} ریال</td>
            <td><button class="delete-account" data-idx="${idx}">حذف</button></td>
        `;
        tbody.appendChild(row);
    });
    document.querySelectorAll('.delete-account').forEach(btn =>
        btn.addEventListener('click', e => {
            const i = +e.target.dataset.idx;
            if (confirm('آیا از حذف این حساب مطمئنید؟')) {
                accounts.splice(i, 1);
                saveToLocalStorage();
                updateDashboard();
                updateCustomerTable(filtered);
            }
        })
    );
}

// جستجوی مشتریان
document.getElementById('search-customer-form').addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-customer-input').value.trim();
    const res = accounts.filter(a =>
        a.firstName.includes(q) ||
        a.lastName.includes(q) ||
        a.phoneNumber.includes(q) ||
        a.citizenCode.includes(q) ||
        a.accountNumber.includes(q)
    );
    updateCustomerTable(res);
});

// نمایش سابقه تراکنش‌ها
document.getElementById('search-transaction-form').addEventListener('submit', e => {
    e.preventDefault();
    const accNum = document.getElementById('search-account-number').value;
    const out = document.getElementById('transaction-history-results');
    out.innerHTML = '';

    const list = transactions.filter(t => t.accountNumber === accNum);
    if (!list.length) {
        out.innerHTML = '<p>هیچ تراکنشی یافت نشد.</p>';
        document.getElementById('print-transaction-history').style.display = 'none';
        return;
    }

    const tbl = document.createElement('table');
    tbl.style.width = '100%'; tbl.border = '1';
    const hdr = document.createElement('tr');
    hdr.innerHTML = '<th>مبلغ</th><th>نوع</th><th>تاریخ</th>';
    tbl.appendChild(hdr);

    list.forEach(t => {
        const r = document.createElement('tr');
        const pd = new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short'})
                   .format(new Date(t.date)).split('، ')[0];
        r.innerHTML = `
            <td>${t.amount.toLocaleString()} ریال</td>
            <td>${t.type}</td>
            <td>${pd}</td>
        `;
        tbl.appendChild(r);
    });

    out.appendChild(tbl);
    document.getElementById('print-transaction-history').style.display = 'inline-block';
});

// پرینت سابقه تراکنش‌ها
document.getElementById('print-transaction-history').addEventListener('click', () => {
    const accNum = document.getElementById('search-account-number').value;
    const out = document.getElementById('transaction-history-results');
    if (!out.innerHTML.trim()) {
        alert('هیچ محتوایی برای پرینت موجود نیست!');
        return;
    }
    const acc = accounts.find(a => a.accountNumber === accNum);
    if (!acc) {
        alert('صاحب حساب یافت نشد!');
        return;
    }

    const w = window.open('', '_blank');
    w.document.write('<html><head><title>تاریخچه تراکنش‌ها</title><style>');
    w.document.write(`
        body {font-family:Arial,sans-serif;direction:rtl;margin:20px;}
        table {width:100%;border-collapse:collapse;text-align:center;margin:1rem 0;}
        th,td {border:1px solid #ddd;padding:8px;}
        th {background:#007bff;color:#fff;}
        .info {margin-bottom:20px;}
    `);
    w.document.write('</style></head><body>');
    w.document.write('<h2>تاریخچه تراکنش‌ها</h2>');
    w.document.write(`
        <div class="info">
            <p><strong>نام:</strong> ${acc.firstName} ${acc.lastName}</p>
            <p><strong>شماره حساب:</strong> ${acc.accountNumber}</p>
            <p><strong>کد شهروندی:</strong> ${acc.citizenCode}</p>
            <p><strong>تلفن:</strong> ${acc.phoneNumber}</p>
            <p><strong>موجودی:</strong> ${acc.balance.toLocaleString()} ریال</p>
        </div>
    `);
    w.document.write(out.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
});

initializeApp();
