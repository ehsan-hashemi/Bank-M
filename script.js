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

function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(section => section.style.display = 'none');
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

    if (accounts.some(account => account.citizenCode === citizenCode)) {
        alert('کد شهروندی تکراری است!');
        return;
    }

    const account = { firstName, lastName, phoneNumber, citizenCode, accountNumber, balance: initialBalance };
    accounts.push(account);

    // ثبت تراکنش به عنوان "ایجاد حساب"
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

// ثبت تراکنش
document.getElementById('transaction-form').addEventListener('submit', event => {
    event.preventDefault();

    const accountNumber = document.getElementById('account-number').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const type = document.getElementById('transaction-type').value;
    const date = new Date();

    const account = accounts.find(acc => acc.accountNumber === accountNumber);
    if (!account) {
        alert('حسابی با این شماره حساب وجود ندارد!');
        return;
    }

    if (type === 'withdraw' && account.balance < amount) {
        alert('موجودی کافی نیست!');
        return;
    }

    account.balance += type === 'deposit' ? amount : -amount;
    transactions.push({
        accountNumber,
        amount,
        type: type === 'deposit' ? 'افزایش' : 'کاهش',
        date
    });

    saveToLocalStorage();
    updateDashboard();
    updateCustomerTable();
    alert('تراکنش با موفقیت ثبت شد!');

    document.getElementById('transaction-form').reset();
});

// دکمه پاک کردن همه اطلاعات
const clearDataButton = document.createElement('button');
clearDataButton.innerText = 'پاک کردن تمام اطلاعات';
clearDataButton.style.backgroundColor = '#e63946';
clearDataButton.style.color = 'white';
clearDataButton.style.padding = '0.5rem 1rem';
clearDataButton.style.marginTop = '1rem';
clearDataButton.style.border = 'none';
clearDataButton.style.cursor = 'pointer';

clearDataButton.addEventListener('click', () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام اطلاعات را پاک کنید؟')) {
        localStorage.clear();
        accounts.length = 0;
        transactions.length = 0;
        updateDashboard();
        updateCustomerTable();
        alert('تمام اطلاعات پاک شدند!');
    }
});

document.querySelector('main').appendChild(clearDataButton);

// به‌روزرسانی داشبورد
function updateDashboard() {
    document.getElementById('customer-count').innerText = accounts.length;
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    document.getElementById('total-balance').innerText = totalBalance.toLocaleString() + ' ریال';
}

// به‌روزرسانی جدول مشتریان با دکمه حذف
function updateCustomerTable() {
    const tbody = document.querySelector('#customers-table tbody');
    tbody.innerHTML = '';
    accounts.forEach((account, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${account.firstName}</td>
            <td>${account.lastName}</td>
            <td>${account.phoneNumber}</td>
            <td>${account.citizenCode}</td>
            <td>${account.accountNumber}</td>
            <td>${account.balance.toLocaleString()} ریال</td>
            <td><button class="delete-account" data-index="${index}">حذف</button></td>
        `;
        tbody.appendChild(row);
    });

    // اضافه کردن رویداد کلیک به دکمه‌های حذف
    document.querySelectorAll('.delete-account').forEach(button => {
        button.addEventListener('click', event => {
            const index = event.target.getAttribute('data-index');
            if (confirm('آیا مطمئن هستید که می‌خواهید این حساب را حذف کنید؟')) {
                accounts.splice(index, 1); // حذف حساب از آرایه
                saveToLocalStorage(); // ذخیره تغییرات در localStorage
                updateDashboard();
                updateCustomerTable();
                alert('حساب با موفقیت حذف شد!');
            }
        });
    });
}

// تاریخچه تراکنش‌ها
document.getElementById('search-transaction-form').addEventListener('submit', event => {
    event.preventDefault();

    const accountNumber = document.getElementById('search-account-number').value;
    const resultsDiv = document.getElementById('transaction-history-results');
    resultsDiv.innerHTML = '';

    // فیلتر تراکنش‌ها بر اساس شماره حساب
    const accountTransactions = transactions.filter(transaction => transaction.accountNumber === accountNumber);

    if (accountTransactions.length === 0) {
        resultsDiv.innerHTML = '<p>هیچ تراکنشی برای این شماره حساب یافت نشد.</p>';
        document.getElementById('print-transaction-history').style.display = 'none';
        return;
    }

    // ایجاد جدول برای نمایش تراکنش‌ها
    const table = document.createElement('table');
    table.style.width = '100%';
    table.border = '1';

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>مبلغ</th>
        <th>نوع تراکنش</th>
        <th>تاریخ</th>
        <th>ساعت</th>
    `;
    table.appendChild(headerRow);

    accountTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        const persianDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(transaction.date));
        const [date, time] = persianDate.split('، ');

        row.innerHTML = `
            <td>${transaction.amount.toLocaleString()} ریال</td>
            <td>${transaction.type}</td>
            <td>${date}</td>
            <td>${time}</td>
        `;
        table.appendChild(row);
    });

    resultsDiv.appendChild(table);

    // نمایش دکمه پرینت
    document.getElementById('print-transaction-history').style.display = 'inline-block';
});

// دکمه پرینت
document.getElementById('print-transaction-history').addEventListener('click', () => {
    const accountNumber = document.getElementById('search-account-number').value;
    const resultsDiv = document.getElementById('transaction-history-results');

    if (resultsDiv.innerHTML.trim() === '') {
        alert('هیچ محتوایی برای پرینت وجود ندارد!');
        return;
    }

    const account = accounts.find(acc => acc.accountNumber === accountNumber);

    if (!account) {
        alert('اطلاعات صاحب حساب یافت نشد!');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>تاریخچه تراکنش‌ها</title><style>');
    printWindow.document.write(`
        body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
        table { width: 100%; border-collapse: collapse; text-align: center; margin: 1rem 0; }
        table th, table td { border: 1px solid #ddd; padding: 8px; }
        table th { background-color: #007bff; color: white; }
        .account-info { margin-bottom: 20px; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h2>تاریخچه تراکنش‌ها</h2>');

    // اضافه کردن اطلاعات صاحب حساب
    printWindow.document.write(`
        <div class="account-info">
            <p><strong>نام: </strong>${account.firstName} ${account.lastName}</p>
            <p><strong>شماره حساب: </strong>${account.accountNumber}</p>
            <p><strong>کد شهروندی: </strong>${account.citizenCode}</p>
            <p><strong>شماره تلفن: </strong>${account.phoneNumber}</p>
            <p><strong>موجودی فعلی: </strong>${account.balance.toLocaleString()} ریال</p>
        </div>
    `);

    // افزودن جدول تاریخچه تراکنش‌ها
    printWindow.document.write(resultsDiv.innerHTML);

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
});

initializeApp();