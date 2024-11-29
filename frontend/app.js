const apiUrl = 'http://localhost:5000/api/students';
const studentList = document.getElementById('student-list');
const studentForm = document.getElementById('student-form');

async function fetchStudents() {
    const response = await fetch(apiUrl);
    const students = await response.json();
    studentList.innerHTML = students.map(student => `
        <div class="student">
            <p><strong>ID:</strong> ${student.StudentID}</p>
            <p><strong>Name:</strong> ${student.Name}</p>
            <button onclick="deleteStudent('${student._id}')">Delete</button>
        </div>
    `).join('');
}

studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const student = {
        StudentID: document.getElementById('studentID').value,
        Name: document.getElementById('name').value,
        Roll: document.getElementById('roll').value,
        Birthday: document.getElementById('birthday').value,
        Address: document.getElementById('address').value
    };

    await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(student)
    });
    fetchStudents();
});

async function deleteStudent(id) {
    await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
    fetchStudents();
}

fetchStudents();
