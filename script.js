let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
let editingIndex = -1;

function toggleForm(pagePrefix, showForm) {
    document.getElementById(`${pagePrefix}-list-view`).style.display = showForm ? 'none' : 'block';
    document.getElementById(`${pagePrefix}-form-view`).style.display = showForm ? 'block' : 'none';
}
function renderEmployeesTable() {
 
    const tbody = document.querySelector('#employees-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (window.db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No employees found.</td></tr>';
        return;
    }

    window.db.employees.forEach((emp, index) => {
        const row = `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.position}</td>
                <td>${emp.dept}</td>
                <td>${emp.hireDate || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editEmployee(${index})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${index})">Delete</button>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });

    toggleForm('emp', false);
}

function editEmployee(index) {
    editingIndex = index;
    const emp = window.db.employees[index];

    updateEmployeeDeptDropdown();

    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-name').value = emp.name;
    document.getElementById('emp-pos').value = emp.position;
    document.getElementById('emp-hire-date').value = emp.hireDate || '';
    document.getElementById('emp-dept').value = emp.dept;
    
    toggleForm('emp', true);
}
function saveEmployee(e) {

    if (e) e.preventDefault(); 

    const empId = document.getElementById('emp-id').value;
    const empName = document.getElementById('emp-name').value;
    const empPos = document.getElementById('emp-pos').value;
    const empDept = document.getElementById('emp-dept').value;
    const empHire = document.getElementById('emp-hire-date').value;


    if (!empId || !empName || !empDept) {
        alert("Please fill in ID, Name, and Department!");
        return;
    }

    const data = {
        id: empId,
        name: empName,
        position: empPos,
        dept: empDept,
        hireDate: empHire
    };


    if (editingIndex > -1) {
        window.db.employees[editingIndex] = data;
    } else {
        window.db.employees.push(data);
    }

    editingIndex = -1;
    saveToStorage(); 
    renderEmployeesTable(); 
    toggleForm('emp', false); 
}

function deleteEmployee(index) {
    if (confirm("Are you sure you want to remove this employee?")) {
        window.db.employees.splice(index, 1);
        saveToStorage();
        renderEmployeesTable();
    }
}
function updateEmployeeDeptDropdown() {
    const deptSelect = document.getElementById('emp-dept');
    if (!deptSelect) return;
    deptSelect.innerHTML = '<option value="" disabled selected>Select a Department</option>';
    window.db.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        deptSelect.appendChild(option);
    });
}

function toggleForm(pagePrefix, showForm) {
    if (pagePrefix === 'emp' && showForm) {
        updateEmployeeDeptDropdown();
    }
    document.getElementById(`${pagePrefix}-list-view`).style.display = showForm ? 'none' : 'block';
    document.getElementById(`${pagePrefix}-form-view`).style.display = showForm ? 'block' : 'none';
}

window.db = { accounts: [], departments: [], employees: [], requests: [] };

function init() {
    loadFromStorage();

    const savedEmail = localStorage.getItem('auth_token');
    if (savedEmail) {
        const user = window.db.accounts.find(a => a.email === savedEmail);
        if (user) setAuthState(true, user);
    }

    window.addEventListener('hashchange', handleRouting);
    if (!window.location.hash) window.location.hash = '#/';
    handleRouting();
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (hash === '#/') showPage('page-home');
    else if (hash === '#/register') showPage('page-register');
    else if (hash === '#/verify-email') showPage('page-verify-email');
    else if (hash === '#/login') showPage('page-login');
    else if (hash === '#/profile') checkAuth('page-profile', renderProfile);
    else if (hash === '#/employees') checkAdmin('page-employees', renderEmployeesTable);
    else if (hash === '#/departments') checkAdmin('page-departments', renderDepartmentsList);
    // NEW ROUTES
    else if (hash === '#/accounts') checkAdmin('page-accounts', renderAccountsTable);
    else if (hash === '#/my-requests') checkAuth('page-my-requests', renderRequestsTable);
}

function renderAccountsTable() {
    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    window.db.accounts.forEach((acc, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${acc.fname} ${acc.lname}</td>
                <td>${acc.email}</td>
                <td>${acc.role}</td>
                <td>${acc.verified ? '✅' : '❌'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editAccount(${index})">Edit</button>
                    <button class="btn btn-sm btn-warning" onclick="resetPassword(${index})">Reset Password</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})">Delete</button>
                </td>
            </tr>`;
    });
    toggleForm('acc', false);
}

function editAccount(index) {
    editingIndex = index;
    const acc = window.db.accounts[index];
    document.getElementById('acc-fname').value = acc.fname;
    document.getElementById('acc-lname').value = acc.lname;
    document.getElementById('acc-email').value = acc.email;
    document.getElementById('acc-role').value = acc.role;
    document.getElementById('acc-verified').checked = acc.verified;
    toggleForm('acc', true);
}

function deleteAccount(index) {
    if (window.db.accounts[index].email === currentUser.email) {
        return alert("You cannot delete yourself!");
    }
    if (confirm("Are you sure you want to delete this account?")) {
        window.db.accounts.splice(index, 1);
        saveToStorage();
        renderAccountsTable();
    }
}
function saveAccount(e) {
    if (e) e.preventDefault();
    
    const data = {
        fname: document.getElementById('acc-fname').value,
        lname: document.getElementById('acc-lname').value,
        email: document.getElementById('acc-email').value,
        role: document.getElementById('acc-role').value,
        verified: document.getElementById('acc-verified').checked,
        password: window.db.accounts[editingIndex].password // Keep existing password
    };

    window.db.accounts[editingIndex] = data;
    saveToStorage();
    renderAccountsTable();
    toggleForm('acc', false);
}

function renderRequestsTable() {
    const tbody = document.getElementById('requests-table-body');
    if (!tbody) return;


    const isAdmin = currentUser.role === 'admin';
    const reqsToShow = isAdmin ? window.db.requests : window.db.requests.filter(r => r.employeeEmail === currentUser.email);

    tbody.innerHTML = reqsToShow.length ? '' : '<tr><td colspan="5" class="text-center">No requests.</td></tr>';

    reqsToShow.forEach((req, index) => {
        let badgeClass = req.status === 'Approved' ? 'bg-success' : (req.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark');

        tbody.innerHTML += `
            <tr>
                <td>${req.date}</td>
                <td>${isAdmin ? `<strong>${req.employeeEmail}</strong>` : req.type}</td>
                <td>${req.itemCount}</td>
                <td><span class="badge ${badgeClass}">${req.status}</span></td>
                <td>
                    ${isAdmin && req.status === 'Pending' ? 
                        `<button class="btn btn-sm btn-success" onclick="updateRequestStatus(${index}, 'Approved')">Approve</button>
                         <button class="btn btn-sm btn-danger" onclick="updateRequestStatus(${index}, 'Rejected')">Reject</button>` 
                        : `<button class="btn btn-sm btn-outline-danger" onclick="deleteRequest(${index})">Delete</button>`
                    }
                </td>
            </tr>`;
    });
}

function createNewRequest() {
    const type = prompt("Request Type (e.g., Equipment, Leave, Resources):");
    const qty = prompt("How many items/days?");
    
    if (type && qty) {
        const newReq = {
            date: new Date().toLocaleDateString(),
            type: type,
            itemCount: qty,
            status: 'Pending',
            employeeEmail: currentUser.email
        };

        window.db.requests.push(newReq);
        saveToStorage();
        renderRequestsTable();
    }
}

function showPage(id) { 
    const el = document.getElementById(id);
    if (el) el.classList.add('active'); 
}

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window.db = JSON.parse(data);
    } else {
        window.db.accounts.push({ 
            fname: 'Admin', lname: 'User', 
            email: 'samyeshua@gmail.com', password: 'qwerty123', 
            role: 'admin', verified: true 
        });

        window.db.departments.push(
            { name: 'Engineering', description: 'Software and Hardware development' },
            { name: 'HR', description: 'Human Resources and Recruitment' }
        );
        
        saveToStorage();
    }
}

function saveToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db)); }

function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    if (window.db.accounts.find(a => a.email === email)) return alert("User exists!");
    
    const newUser = {
        fname: document.getElementById('reg-fname').value,
        lname: document.getElementById('reg-lname').value,
        email: email,
        password: document.getElementById('reg-pass').value,
        role: 'user', verified: false
    };
    window.db.accounts.push(newUser);
    localStorage.setItem('unverified_email', email);
    saveToStorage();
    window.location.hash = '#/verify-email';
}

function simulateVerification() {
    const email = localStorage.getItem('unverified_email');
    const user = window.db.accounts.find(a => a.email === email);
    if (user) user.verified = true;
    saveToStorage();
    alert("Email verified!");
    window.location.hash = '#/login';
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const user = window.db.accounts.find(a => a.email === email && a.password === pass && a.verified);
    
    if (user) {
        setAuthState(true, user);
        window.location.hash = '#/profile';
    } else {
        alert("Invalid credentials or unverified email.");
    }
}

function setAuthState(isAuth, user = null) {
    currentUser = isAuth ? user : null;
    const body = document.body;

    if (isAuth) {
        localStorage.setItem('auth_token', user.email);
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        if (user.role === 'admin') body.classList.add('is-admin');

        const displayEl = document.getElementById('user-display');
        if (displayEl) displayEl.innerText = user.fname; 
    } else {
        localStorage.removeItem('auth_token');
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated', 'is-admin');
    }
}

function logout() {
    setAuthState(false);
    window.location.hash = '#/';
}

function renderDepartmentsList() {
    const tbody = document.getElementById('dept-list-body');
    if (!tbody) return;

    tbody.innerHTML = window.db.departments.length ? '' : '<tr><td colspan="3">No departments found.</td></tr>';

    window.db.departments.forEach((dept, index) => {
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${dept.name}</td>
                <td>${dept.description}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="editDepartment(${index})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${index})">Delete</button>
                </td>
            </tr>`;
    });
}

function deleteDepartment(index) {
    if (confirm("Delete this department?")) {
        window.db.departments.splice(index, 1);
        saveToStorage();
        renderDepartmentsList();
    }
}

function editDepartment(index) {
    const dept = window.db.departments[index];
    const newName = prompt("New Department Name:", dept.name);
    const newDesc = prompt("New Description:", dept.description);

    if (newName) dept.name = newName;
    if (newDesc) dept.description = newDesc;

    saveToStorage();
    renderDepartmentsList();
}

function checkAuth(id, callback) {
    if (!currentUser) return window.location.hash = '#/login';
    showPage(id);
    if (callback) callback();
}

function checkAdmin(id, callback) {
    if (!currentUser || currentUser.role !== 'admin') return window.location.hash = '#/';
    showPage(id);
    if (callback) callback();
}

function renderProfile() {
    document.getElementById('prof-name').innerText = currentUser.fname + " " + currentUser.lname;
    document.getElementById('prof-email').innerText = currentUser.email;
    document.getElementById('prof-role').innerText = currentUser.role;
}
function updateRequestStatus(index, newStatus) {
    window.db.requests[index].status = newStatus;
    saveToStorage();
    renderRequestsTable();
}

function deleteRequest(index) {
    if(confirm("Delete this request?")) {
        window.db.requests.splice(index, 1);
        saveToStorage();
        renderRequestsTable();
    }
}

init();