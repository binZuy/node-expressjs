let students = [];
let currentPage = 1;
let rowsPerPage = 5;
let selectedStudents = new Set();

function showLoading(message = 'Đang xử lý...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = message;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
}

// DOM Elements
const studentsTable = document.getElementById('students-table');
const studentsBody = document.getElementById('students-body');
const modal = document.getElementById('student-modal');
const studentForm = document.getElementById('student-form');
const deleteSelectedBtn = document.getElementById('delete-selected');
const selectAllCheckbox = document.getElementById('select-all');
const rowsPerPageSelect = document.getElementById('rows-per-page');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// Event Listeners
document.getElementById('add-student-btn').addEventListener('click', () => openModal('add'));
studentForm.addEventListener('submit', handleSubmit);
selectAllCheckbox.addEventListener('change', handleSelectAll);
rowsPerPageSelect.addEventListener('change', handleRowsPerPageChange);
deleteSelectedBtn.addEventListener('click', deleteSelectedStudents);
prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));

// Initialize
fetchStudents();

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
}

// Fetch students from API
async function fetchStudents() {
    try {
        const response = await fetch('http://localhost:5000/api/students');
        students = await response.json();
        renderTable();
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

// Render table with pagination

function renderTable() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedStudents = students.slice(start, end);
    
    studentsBody.innerHTML = '';
    
    paginatedStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="student-checkbox" value="${student._id}" 
                ${selectedStudents.has(student._id) ? 'checked' : ''}></td>
            <td>${student.StudentID}</td>
            <td>${student.Name}</td>
            <td>${student.Roll}</td>
            <td>${formatDate(student.Birthday)}</td>
            <td>${student.Address || ''}</td>
            <td class="action-buttons">
                <button class="btn-secondary" onclick="openModal('edit', '${student._id}')">Edit</button>
                <button class="btn-danger" onclick="deleteStudent('${student._id}')">Delete</button>
            </td>
        `;
        studentsBody.appendChild(row);
    });

    // Update pagination info
    const totalPages = Math.ceil(students.length / rowsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    // Update checkboxes
    updateCheckboxStates();
}

// Handle modal operations
function openModal(mode, studentId = null) {
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('student-form');
    
    if (mode === 'add') {
        modalTitle.textContent = 'Add Student';
        form.reset();
        form.setAttribute('data-mode', 'add');
    } else {
        modalTitle.textContent = 'Edit Student';
        const student = students.find(s => s._id === studentId);
        if (student) {
            document.getElementById('StudentID').value = student.StudentID;
            document.getElementById('Name').value = student.Name;
            document.getElementById('Roll').value = student.Roll;
            document.getElementById('Birthday').value = student.Birthday ? new Date(student.Birthday).toISOString().split('T')[0] : '';
            document.getElementById('Address').value = student.Address || '';
            form.setAttribute('data-mode', 'edit');
            form.setAttribute('data-id', studentId);
        }
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        StudentID: parseInt(document.getElementById('StudentID').value),
        Name: document.getElementById('Name').value,
        Roll: parseInt(document.getElementById('Roll').value),
        Birthday: document.getElementById('Birthday').value,
        Address: document.getElementById('Address').value
    };

    const mode = e.target.getAttribute('data-mode');
    const url = 'http://localhost:5000/api/students';
    
    try {
        if (mode === 'add') {
            // Check for duplicate student ID
            if (students.some(s => s.StudentID === formData.StudentID)) {
                alert('Student ID already exists!');
                return;
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                await fetchStudents();
                closeModal();
            } else {
                const error = await response.json();
                alert(error.message || 'Error saving student');
            }
        } else {
            const studentId = e.target.getAttribute('data-id');
            const response = await fetch(`${url}/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                await fetchStudents();
                closeModal();
            } else {
                const error = await response.json();
                alert(error.message || 'Error updating student');
            }
        }
    } catch (error) {
        console.error('Error saving student:', error);
        alert('Error saving student');
    }
}

// Handle delete operations
async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            const response = await fetch(`http://localhost:5000/api/students/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await fetchStudents();
                selectedStudents.delete(id);
                updateDeleteSelectedButton();
            } else {
                const error = await response.json();
                alert(error.message || 'Error deleting student');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Error deleting student');
        }
    }
}

async function deleteSelectedStudents() {
    if (confirm(`Are you sure you want to delete ${selectedStudents.size} students?`)) {
        try {
            const deletePromises = Array.from(selectedStudents).map(id =>
                fetch(`http://localhost:5000/api/students/${id}`, { method: 'DELETE' })
            );
            
            await Promise.all(deletePromises);
            selectedStudents.clear();
            await fetchStudents();
            updateDeleteSelectedButton();
        } catch (error) {
            console.error('Error deleting students:', error);
            alert('Error deleting multiple students');
        }
    }
}

// Handle checkbox operations
function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    
    checkboxes.forEach(checkbox => {
        const studentId = checkbox.value;
        if (e.target.checked) {
            selectedStudents.add(studentId);
        } else {
            selectedStudents.delete(studentId);
        }
        checkbox.checked = e.target.checked;
    });
    
    updateDeleteSelectedButton();
}

function updateCheckboxStates() {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedStudents.add(e.target.value);
            } else {
                selectedStudents.delete(e.target.value);
            }
            updateDeleteSelectedButton();
            updateSelectAllCheckbox();
        });
        
        checkbox.checked = selectedStudents.has(checkbox.value);
    });
    
    updateSelectAllCheckbox();
}

function updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    selectAllCheckbox.checked = allChecked && checkboxes.length > 0;
}

function updateDeleteSelectedButton() {
    if (selectedStudents.size > 0) {
        deleteSelectedBtn.classList.remove('hidden');
        deleteSelectedBtn.textContent = `Delete Selected (${selectedStudents.size})`;
    } else {
        deleteSelectedBtn.classList.add('hidden');
    }
}

// Handle pagination
function handleRowsPerPageChange(e) {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
}

function changePage(newPage) {
    currentPage = newPage;
    renderTable();
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
}

// Thêm biến mới (thêm vào ngay sau khai báo các biến đầu file)
let filteredStudents = [];

// Thêm event listeners mới (thêm vào cùng khu vực event listeners)
document.getElementById('search-input').addEventListener('input', handleSearch);
document.getElementById('add-sample-btn').addEventListener('click', addSampleData);

// Sửa lại hàm fetchStudents
async function fetchStudents() {
    showLoading('Đang tải dữ liệu...');
    try {
        const response = await fetch('http://localhost:5000/api/students');
        students = await response.json();
        filteredStudents = [...students];
        renderTable();
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Lỗi khi tải dữ liệu sinh viên');
    } finally {
        hideLoading();
    }
}
// Sửa lại hàm renderTable
function renderTable() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const displayedStudents = filteredStudents.length > 0 ? filteredStudents : students;
    const paginatedStudents = displayedStudents.slice(start, end);
    
    studentsBody.innerHTML = '';
    
    paginatedStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="student-checkbox" value="${student._id}" 
                ${selectedStudents.has(student._id) ? 'checked' : ''}></td>
            <td>${student.StudentID}</td>
            <td>${student.Name}</td>
            <td>${student.Roll}</td>
            <td>${formatDate(student.Birthday)}</td>
            <td>${student.Address || ''}</td>
            <td class="action-buttons">
                <button class="btn-secondary" onclick="openModal('edit', '${student._id}')">Edit</button>
                <button class="btn-danger" onclick="deleteStudent('${student._id}')">Delete</button>
            </td>
        `;
        studentsBody.appendChild(row);
    });

    // Update pagination info
    const totalPages = Math.ceil(displayedStudents.length / rowsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    updateCheckboxStates();
}

// Thêm các hàm mới
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredStudents = students.filter(student => 
        student.StudentID.toString().includes(searchTerm) ||
        student.Name.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    renderTable();
}

// Danh sách tên Việt Nam phổ biến
const vietnameseNames = [
    "Nguyễn Văn An", "Trần Thị Bình", "Lê Văn Cường", "Phạm Thị Dung",
    "Hoàng Văn Em", "Ngô Thị Phương", "Vũ Văn Giàu", "Đặng Thị Hoa",
    "Bùi Văn Inh", "Đỗ Thị Kim", "Hồ Văn Lâm", "Mai Thị Mỹ",
    "Phan Văn Nam", "Trương Thị Oanh", "Lý Văn Phát", "Võ Thị Quỳnh",
    "Nguyễn Thị Lan", "Trần Văn Hùng", "Lê Thị Mai", "Phạm Văn Đức"
];

// Danh sách địa chỉ Việt Nam
const vietnameseAddresses = [
    "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng",
    "Cần Thơ", "Biên Hòa", "Nha Trang", "Huế",
    "Quy Nhơn", "Vũng Tàu", "Long Xuyên", "Việt Trì",
    "Thái Nguyên", "Hạ Long", "Thanh Hóa", "Vinh",
    "Đồng Nai", "Bình Dương", "Bắc Ninh", "Hải Dương"
];
 
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStudentId() {
    const faculty = randomInt(1, 4);
    const number = randomInt(0, 9999).toString().padStart(4, '0');
    return parseInt(`202${faculty}${number}`);
}

async function addSampleData() {
    const sampleStudents = [];
    const existingIds = new Set(students.map(s => s.StudentID));

    for (let i = 0; i < 50; i++) {
        let studentId;
        do {
            studentId = generateStudentId();
        } while (existingIds.has(studentId));
        existingIds.add(studentId);

        const student = {
            StudentID: studentId,
            Name: vietnameseNames[randomInt(0, vietnameseNames.length - 1)],
            Roll: randomInt(1, 50),
            Birthday: new Date(randomInt(1995, 2005), randomInt(0, 11), randomInt(1, 28)).toISOString().split('T')[0],
            Address: vietnameseAddresses[randomInt(0, vietnameseAddresses.length - 1)]
        };
        sampleStudents.push(student);
    }

    try {
        const addPromises = sampleStudents.map(student =>
            fetch('http://localhost:5000/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            })
        );

        await Promise.all(addPromises);
        await fetchStudents();
        alert('Đã thêm 50 sinh viên mẫu thành công!');
    } catch (error) {
        console.error('Error adding sample data:', error);
        alert('Lỗi khi thêm dữ liệu mẫu');
    }
}