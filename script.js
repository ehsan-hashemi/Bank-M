function initializeApp() {
  updateDashboard();
  updateCustomerTable();
  renderCheckList();
  renderLoanList();
  checkLoanDueDates();
}

const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const checks = JSON.parse(localStorage.getItem('checks')) || [];
const loans = JSON.parse(localStorage.getItem('loans')) || [];

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

function saveToLocalStorage() {
  localStorage.setItem('accounts', JSON.stringify(accounts));
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('checks', JSON.stringify(checks));
  localStorage.setItem('loans', JSON.stringify(loans));
}

function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

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

function updateCheckStatus(index, newStatus) {
  checks[index].status = newStatus;
  saveToLocalStorage();
  renderCheckList();
}

function renderCheckList() {
  const container = document.getElementById('check-list');
  container.innerHTML = '';
  if (checks.length === 0) return container.innerHTML = '<p>چکی ثبت نشده است.</p>';
  checks.sort((a, b) => {
    const priority = {
      "فعال": 0,
      "در انتظار": 1,
      "برگشتی": 2,
      "مسدود": 3
    };
    return priority[a.status] - priority[b.status];
  });
  const table = document.createElement('table');
  table.border = '1';
  table.innerHTML = `
    <tr>
      <th>فرستنده</th><th>گیرنده</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th>
    </tr>
  `;
  checks.forEach((c, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${c.source}</td>
      <td>${c.target}</td>
      <td>${c.amount.toLocaleString()} ریال</td>
      <td>
        <select onchange="updateCheckStatus(${index}, this.value)">
          <option ${c.status === "در انتظار" ? "selected" : ""}>در انتظار</option>
          <option ${c.status === "فعال" ? "selected" : ""}>فعال</option>
          <option ${c.status === "برگشتی" ? "selected" : ""}>برگشتی</option>
          <option ${c.status === "مسدود" ? "selected" : ""}>مسدود</option>
        </select>
      </td>
      <td>${new Date(c.date).toLocaleString('fa-IR')}</td>
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
    dueDate: loanDueDate.value, // 👈 فیلد اضافه‌شده
    status: loanStatus.value,
    date: new Date(),
    priority: 0
  };
  loans.push(loan);
  saveToLocalStorage();
  renderLoanList();
  alert('وام ثبت شد!');
  event.target.reset();
});

function updateLoanStatus(index, newStatus) {
  loans[index].status = newStatus;
  saveToLocalStorage();
  renderLoanList();
}

function renderLoanList() {
  const container = document.getElementById('loan-list');
  container.innerHTML = '';
  if (loans.length === 0) return container.innerHTML = '<p>وامی ثبت نشده است.</p>';

  loans.sort((a, b) => {
    const statusPriority = {
      "در حال پرداخت": 0,
      "در انتظار پرداخت": 1,
      "بازپرداخت کامل": 2
    };
    return (statusPriority[a.status] - (a.priority || 0)) - 
           (statusPriority[b.status] - (b.priority || 0));
  });

  const table = document.createElement('table');
  table.border = '1';
  table.innerHTML = `
    <tr>
      <th>شماره حساب</th><th>مبلغ</th><th>کارمزد</th><th>مهلت</th><th>وضعیت</th><th>تاریخ</th>
    </tr>
  `;
  loans.forEach((l, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${l.account}</td>
      <td>${l.amount.toLocaleString()} ریال</td>
      <td>${l.interest}%</td>
      <td>${l.dueDate}</td>
      <td>
        <select onchange="updateLoanStatus(${index}, this.value)">
          <option ${l.status === "در حال پرداخت" ? "selected" : ""}>در حال پرداخت</option>
          <option ${l.status === "در انتظار پرداخت" ? "selected" : ""}>در انتظار پرداخت</option>
          <option ${l.status === "بازپرداخت کامل" ? "selected" : ""}>بازپرداخت کامل</option>
        </select>
      </td>
      <td>${new Date(l.date).toLocaleString('fa-IR')}</td>
    `;
    table.appendChild(row);
  });
  container.appendChild(table);
}

function checkLoanDueDates() {
  const today = new Date();
  loans.forEach((l, index) => {
    const due = new Date(l.dueDate);
    if (due <= today && l.status !== "بازپرداخت کامل") {
      l.priority = -1;
      showNotification(`⏰ مهلت پرداخت وام شماره حساب «${l.account}» رسیده است!`);
    } else {
      l.priority = 0;
    }
  });
  saveToLocalStorage();
  renderLoanList();
}

function showNotification(message) {
  const banner = document.createElement('div');
  banner.innerText = message;
  banner.className = "loan-alert";
  banner.style = `
    background-color: #ffc107;
    padding: 10px;
    margin: 10px;
    border-radius: 5px;
    font-weight: bold;
    text-align: center;
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 8000);
}

setInterval(checkLoanDueDates, 60000); // بررسی موعد هر دقیقه

initializeApp();