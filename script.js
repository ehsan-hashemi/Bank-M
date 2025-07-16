function initializeApp() {
    updateDashboard();
    updateCustomerTable();
    renderCheckList();
    renderLoanList();
}

// داده‌ها
const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const checks = JSON.parse(localStorage.getItem('checks')) || [];
const loans = JSON.parse(localStorage.getItem('loans')) || [];

// مدیریت صفحات
document.getElementById('dashboard-link').addEventListener('click', () => showSection('dashboard'));
document.getElementById('create-account-link').addEventListener('click', () => showSection('create-account'));
document.getElementById('customers-link').addEventListener('click', () => showSection('customers'));
document.getElementById('transactions-link').addEventListener('click', () => showSection('transactions'));
document.getElementById('history-link').addEventListener('click', () => showSection('transaction-history-section'));
document.getElementById('checks-link').addEventListener('click', () => showSection('checks'));
document.getElementById('loans-link').addEventListener('click', () => showSection('loans'));

function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(section => section.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

// ذخیره
function saveToLocalStorage() {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('checks', JSON.stringify(checks));
    localStorage.setItem('loans', JSON.stringify(loans));
}

// شماره حساب تصادفی
function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// ایجاد حساب جدید
document.getElementById('create-account-form').addEventListener('submit', event => {
    event.preventDefault();
    const account = {
        firstName: firstName.value,
        lastName: lastName.value,
        phoneNumber: phoneNumber.value,
        citizenCode: citizenCode.value,
        accountNumber: generateAccountNumber(),
        balance: parseFloat(initialBalance.value)
    };
    accounts.push(account);

    transactions.push({
        accountNumber: account.accountNumber,
        amount: account.balance,
        type: 'ایجاد حساب',
        date: new Date()
    });

    saveToLocalStorage();
    updateDashboard();
    updateCustomerTable();
    alert('حساب با موفقیت ایجاد شد!');
    event.target.reset();
});

// تراکنش‌ها
document.getElementById('transaction-type').addEventListener('change', event => {
    document.getElementById('transfer-fields').style.display = event.target.value === 'transfer' ? 'block' : 'none';
});

document.getElementById('transaction-form').addEventListener('submit', event => {
    event.preventDefault();
    const type = transactionType.value;
    const amount = parseFloat(transactionAmount.value);
    const accountNumber = accountNumberInput.value;
    const account = accounts.find(acc => acc.accountNumber === accountNumber);
    const date = new Date();

    if (!account) return alert('حساب مبدا پیدا نشد!');

    if (type === 'deposit') {
        account.balance += amount;
        transactions.push({ accountNumber, amount, type: 'افزایش', date });
    } else if (type === 'withdraw') {
        if (account.balance < amount) return alert('موجودی کافی نیست!');
        account.balance -= amount;
        transactions.push({ accountNumber, amount, type: 'کاهش', date });
    } else if (type === 'transfer') {
        const destinationNumber = destinationAccount.value;
        const destination = accounts.find(acc => acc.accountNumber === destinationNumber);
        if (!destination) return alert('حساب مقصد پیدا نشد!');
        if (account.balance < amount) return alert('موجودی کافی نیست!');
        account.balance -= amount;
        destination.balance += amount;
        transactions.push({ accountNumber, amount, type: 'کارت به کارت (مبدا)', date });
        transactions.push({ accountNumber: destinationNumber, amount, type: 'کارت به کارت (مقصد)', date });
    }

    saveToLocalStorage();
    updateDashboard();
    updateCustomerTable();
    alert('تراکنش با موفقیت انجام شد!');
    event.target.reset();
    document.getElementById('transfer-fields').style.display = 'none';
});

// جدول مشتریان
function updateCustomerTable() {
    const tbody = document.querySelector('#customers-table tbody');
    tbody.innerHTML = '';
    const search = document.getElementById('search-customer-input').value.toLowerCase();

    accounts.forEach((account, index) => {
        const match = `${account.firstName} ${account.lastName} ${account.phoneNumber} ${account.accountNumber}`.toLowerCase();
        if (!match.includes(search)) return;

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

    document.querySelectorAll('.delete-account').forEach(button => {
        button.addEventListener('click', e => {
            const index = e.target.dataset.index;
            if (confirm('آیا مطمئنید؟')) {
                accounts.splice(index, 1);
                saveToLocalStorage();
                updateDashboard();
                updateCustomerTable();
            }
        });
    });
}

document.getElementById('search-customer-input').addEventListener('input', updateCustomerTable);

// داشبورد
function updateDashboard() {
    document.getElementById('customer-count').innerText = accounts.length;
    const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    document.getElementById('total-balance').innerText = total.toLocaleString() + ' ریال';
}

// چک‌ها
document.getElementById('check-form').addEventListener('submit', event => {
    event.preventDefault();
    const check = {
        source: checkSource.value,
        target: checkTarget.value,
        amount: parseFloat(checkAmount.value),
        status: checkStatus.value,
        date: new Date()
    };
    checks.push(check);
    saveToLocalStorage();
    renderCheckList();
    event.target.reset();
    alert('چک ثبت شد!');
});

function renderCheckList() {
    const container = document.getElementById('check-list');
    container.innerHTML = '';
    if (checks.length === 0) return container.innerHTML = '<p>چکی ثبت نشده است.</p>';

    const table = document.createElement('table');
    table.border = '1';
    table.innerHTML = `
        <tr>
            <th>فرستنده</th><th>گیرنده</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th>
        </tr>
    `;
    checks.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${c.source}</td><td>${c.target}</td>
            <td>${c.amount.toLocaleString()} ریال</td>
            <td>${c.status}</td><td>${new Date(c.date).toLocaleString('fa-IR')}</td>
        `;
        table.appendChild(row);
    });
    container.appendChild(table);
}

// وام‌ها
document.getElementById('loan-form').addEventListener('submit', event => {
    event.preventDefault();
    const loan = {
        account: loanAccount.value,
        amount: parseFloat(loanAmount.value),
        interest: parseFloat(loanInterest.value),
        status: loanStatus.value,
        date: new Date()
    };
    loans.push(loan);
    saveToLocalStorage();
    renderLoanList();
    event.target.reset();
    alert('وام ثبت شد!');
});

function renderLoanList() {
    const container = document.getElementById('loan-list');
    container.innerHTML = '';
    if (loans.length === 0) return container.innerHTML = '<p>وامی ثبت نشده است.</p>';

    const table = document.createElement('table');
    table.border = '1';
    table.innerHTML = `
        <tr>
            <th>شماره حساب</th><th>مبلغ</th><th>کارمزد</th><th>وضعیت</th><th>تاریخ</th>
        </tr>
    `;
    loans.forEach(l => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${l.account}</td>
            <td>${l.amount.toLocaleString()} ریال</td>
            <td>${l.interest}%</td>
            <td>${l.status}</td>
            <td>${new Date(l.date).toLocaleString('fa-IR')}</td>
        `;
        table.appendChild(row);
    });
    container.appendChild(table);
}

initializeApp();