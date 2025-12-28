// =======================
// EMPLOYEE MANAGEMENT SYSTEM – FINAL FIXED JS
// =======================

// FORM & UI ELEMENTS
const form = document.getElementById('addEmployeeForm');
const tableBody = document.querySelector('#employeeTable tbody');
const searchInput = document.getElementById('searchInput');

const totalEmployeesBox = document.getElementById('totalEmployeesBox')?.querySelector('p');
const averageAgeBox = document.getElementById('averageAgeBox')?.querySelector('p');
const deptCountBox = document.getElementById('deptCountBox')?.querySelector('p');

let employeesData = [];
let deptChart = null;
let ageChart = null;

// =======================
// DEPARTMENT BADGE
// =======================
function departmentBadge(dept) {
    const colors = {
        IT: '#2a5298',
        HR: '#4a90e2',
        Sales: '#0072ff',
        Marketing: '#1e3c72',
        Admin: '#17a2b8'
    };
    return `<span class="badge" style="background:${colors[dept] || '#6c757d'}">${dept}</span>`;
}

// =======================
// FETCH EMPLOYEES (SAFE)
// =======================
function fetchEmployees() {
    fetch("http://127.0.0.1:8000/employees")
        .then(res => {
            if (!res.ok) throw new Error("Backend not running");
            return res.json();
        })
        .then(data => {
            employeesData = data;
            renderEmployees();
        })
        .catch(() => {
            console.warn("Backend not available (GitHub Pages mode)");
            renderEmployees(); // still render charts & summary
        });
}

// =======================
// RENDER EMPLOYEE TABLE
// =======================
function renderEmployees() {
    if (!tableBody) return;

    tableBody.innerHTML = "";
    employeesData.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.id || "-"}</td>
            <td><input type="text" value="${emp.name || ""}"></td>
            <td><input type="number" value="${emp.age || 0}"></td>
            <td>${departmentBadge(emp.department || "N/A")}</td>
            <td>
                <button class="save-btn" onclick="updateEmployee(${emp.id}, this)">Save</button>
                <button class="delete-btn" onclick="deleteEmployee(${emp.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateSummary();
    updateCharts();
}

// =======================
// ADD EMPLOYEE
// =======================
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();

        const employee = {
            name: document.getElementById('name').value,
            age: parseInt(document.getElementById('age').value),
            department: document.getElementById('department').value
        };

        fetch("http://127.0.0.1:8000/employees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employee)
        }).then(() => {
            form.reset();
            fetchEmployees();
        });
    });
}

// =======================
// SEARCH
// =======================
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();
        tableBody.querySelectorAll('tr').forEach(row => {
            const name = row.cells[1].querySelector('input').value.toLowerCase();
            const age = row.cells[2].querySelector('input').value;
            const dept = row.cells[3].textContent.toLowerCase();
            row.style.display =
                name.includes(filter) || age.includes(filter) || dept.includes(filter)
                    ? ''
                    : 'none';
        });
    });
}

// =======================
// UPDATE EMPLOYEE
// =======================
function updateEmployee(id, btn) {
    const row = btn.closest('tr');
    const updatedEmployee = {
        name: row.cells[1].querySelector('input').value,
        age: parseInt(row.cells[2].querySelector('input').value),
        department: row.cells[3].textContent.trim()
    };

    fetch(`http://127.0.0.1:8000/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEmployee)
    }).then(() => fetchEmployees());
}

// =======================
// DELETE EMPLOYEE
// =======================
function deleteEmployee(id) {
    if (!confirm("Delete this employee?")) return;

    fetch(`http://127.0.0.1:8000/employees/${id}`, {
        method: "DELETE"
    }).then(() => fetchEmployees());
}

// =======================
// SUMMARY BOXES
// =======================
function updateSummary() {
    const total = employeesData.length;
    const avgAge = total
        ? (employeesData.reduce((s, e) => s + e.age, 0) / total).toFixed(1)
        : 0;

    const deptCounts = {};
    employeesData.forEach(e => {
        deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
    });

    if (totalEmployeesBox) totalEmployeesBox.textContent = total;
    if (averageAgeBox) averageAgeBox.textContent = avgAge;
    if (deptCountBox) {
        deptCountBox.textContent = Object.entries(deptCounts)
            .map(([d, c]) => `${d}: ${c}`)
            .join(" | ");
    }
}

// =======================
// CHARTS (NO CONFLICT)
// =======================
function updateCharts() {
    const deptCounts = {};
    const ages = [];

    employeesData.forEach(emp => {
        deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
        ages.push(emp.age);
    });

    if (deptChart) deptChart.destroy();
    if (ageChart) ageChart.destroy();

    const deptCanvas = document.getElementById('deptChart');
    const ageCanvas = document.getElementById('ageChart');

    if (deptCanvas) {
        deptChart = new Chart(deptCanvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(deptCounts),
                datasets: [{
                    data: Object.values(deptCounts),
                    backgroundColor: ['#2a5298', '#4a90e2', '#0072ff', '#1e3c72', '#17a2b8']
                }]
            },
            options: { responsive: true }
        });
    }

    if (ageCanvas) {
        ageChart = new Chart(ageCanvas, {
            type: 'bar',
            data: {
                labels: ages.map((_, i) => `Emp ${i + 1}`),
                datasets: [{
                    label: 'Age Distribution',
                    data: ages,
                    backgroundColor: '#2a5298'
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

// =======================
// SIDEBAR SCROLL
// =======================
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.getElementById(link.dataset.target);
        if (target) {
            document.querySelector('.main-content')
                .scrollTo({ top: target.offsetTop, behavior: 'smooth' });
        }
    });
});

// =======================
// EXTRA CHARTS
// =======================
const reportsCanvas = document.getElementById('reportsChart');
if (reportsCanvas) {
    new Chart(reportsCanvas, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Pending'],
            datasets: [{
                data: [1, 1, 1],
                backgroundColor: ['#28a745', '#ffc107', '#dc3545']
            }]
        }
    });
}

const settingsCanvas = document.getElementById('settingsChart');
if (settingsCanvas) {
    new Chart(settingsCanvas, {
        type: 'bar',
        data: {
            labels: ['Admin', 'Manager', 'Employee'],
            datasets: [{
                label: 'Users',
                data: [2, 5, 20],
                backgroundColor: ['#2a5298', '#4a90e2', '#0072ff']
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

// =======================
// INIT
// =======================
fetchEmployees();
