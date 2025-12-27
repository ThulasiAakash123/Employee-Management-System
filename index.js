// Employee Management
const form = document.getElementById('addEmployeeForm');
const tableBody = document.querySelector('#employeeTable tbody');
const searchInput = document.getElementById('searchInput');
const totalEmployeesBox = document.getElementById('totalEmployeesBox').querySelector('p');
const averageAgeBox = document.getElementById('averageAgeBox').querySelector('p');
const deptCountBox = document.getElementById('deptCountBox').querySelector('p');

let employeesData = [];
let deptChart, ageChart;

// Department badge
function departmentBadge(dept) {
    const colors = { IT:'#2a5298', HR:'#4a90e2', Sales:'#0072ff', Teacher:'#1e3c72', Admin:'#17a2b8' };
    const color = colors[dept] || '#6c757d';
    return `<span class="badge" style="background:${color}">${dept}</span>`;
}

// Fetch Employees
function fetchEmployees() {
    fetch("http://127.0.0.1:8000/employees")
        .then(res => res.json())
        .then(data => {
            employeesData = data;
            tableBody.innerHTML = "";
            data.forEach(emp => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.id}</td>
                    <td><input type="text" value="${emp.name}"></td>
                    <td><input type="number" value="${emp.age}"></td>
                    <td>${departmentBadge(emp.department)}</td>
                    <td>
                        <button class="save-btn" onclick="updateEmployee(${emp.id}, this)">Save</button>
                        <button class="delete-btn" onclick="deleteEmployee(${emp.id})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            updateSummary();
            updateCharts();
        });
}
fetchEmployees();

// Add Employee
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
    }).then(() => { form.reset(); fetchEmployees(); });
});

// Search Employee
searchInput.addEventListener('input', () => {
    const filter = searchInput.value.toLowerCase();
    tableBody.querySelectorAll('tr').forEach(row => {
        const name = row.cells[1].querySelector('input').value.toLowerCase();
        const age = row.cells[2].querySelector('input').value.toString();
        const dept = row.cells[3].textContent.toLowerCase();
        row.style.display = name.includes(filter) || age.includes(filter) || dept.includes(filter) ? '' : 'none';
    });
});

// Update Employee
function updateEmployee(id, btn) {
    const row = btn.closest('tr');
    const updatedEmployee = {
        name: row.cells[1].querySelector('input').value,
        age: parseInt(row.cells[2].querySelector('input').value),
        department: row.cells[3].textContent
    };
    fetch(`http://127.0.0.1:8000/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEmployee)
    }).then(() => fetchEmployees());
}

// Delete Employee
function deleteEmployee(id) {
    if(!confirm("Are you sure you want to delete this employee?")) return;
    fetch(`http://127.0.0.1:8000/employees/${id}`, { method: "DELETE" })
        .then(() => fetchEmployees());
}

// Update Summary
function updateSummary() {
    const total = employeesData.length;
    const avgAge = total ? (employeesData.reduce((sum,e) => sum+e.age,0)/total).toFixed(1) : 0;
    const deptCounts = {};
    employeesData.forEach(e => { deptCounts[e.department] = (deptCounts[e.department]||0)+1; });
    totalEmployeesBox.textContent = total;
    averageAgeBox.textContent = avgAge;
    deptCountBox.textContent = Object.entries(deptCounts).map(([d,c])=>`${d}: ${c}`).join(' | ');
}

// Update Charts
function updateCharts() {
    const deptCounts = {};
    const ages = [];
    employeesData.forEach(emp => {
        deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
        ages.push(emp.age);
    });

    const deptLabels = Object.keys(deptCounts);
    const deptValues = Object.values(deptCounts);
    const ageLabels = ages.map((_, i) => `Emp ${i+1}`);

    if(deptChart) deptChart.destroy();
    if(ageChart) ageChart.destroy();

    const ctxDept = document.getElementById('deptChart').getContext('2d');
    deptChart = new Chart(ctxDept, {
        type: 'doughnut',
        data: { labels: deptLabels, datasets: [{ data: deptValues, backgroundColor: ['#2a5298','#4a90e2','#0072ff','#1e3c72','#17a2b8'] }] }
    });

    const ctxAge = document.getElementById('ageChart').getContext('2d');
    ageChart = new Chart(ctxAge, {
        type: 'bar',
        data: { labels: ageLabels, datasets: [{ label:'Age', data: ages, backgroundColor:'#2a5298' }] },
        options: { scales: { y:{ beginAtZero:true } } }
    });
}

// Sidebar scroll
const sidebarLinks = document.querySelectorAll('.sidebar a');
const mainContent = document.querySelector('.main-content');
sidebarLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);
        if(targetSection){
            mainContent.scrollTo({ top: targetSection.offsetTop - mainContent.offsetTop, behavior: 'smooth' });
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
});

// Reports Chart (small & centered)
const reportsCanvas = document.getElementById('reportsChart');
if(reportsCanvas){
    new Chart(reportsCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Pending'],
            datasets: [{ data: [1,1,1], backgroundColor: ['#28a745','#ffc107','#dc3545'] }]
        },
        options:{
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Settings Chart
const settingsCanvas = document.getElementById('settingsChart');
if(settingsCanvas){
    new Chart(settingsCanvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels:['Admin','Manager','Employee'],
            datasets:[{ label:'Number of Users', data:[2,5,20], backgroundColor:['#2a5298','#4a90e2','#0072ff'] }]
        },
        options:{ responsive:true, scales:{ y:{ beginAtZero:true } } }
    });
}
