
const API_URL = "https://my-project-rahim.onrender.com";
const STUDENTS_URL = `${API_URL}/students/`;

// DOM Elements
const form = document.getElementById("studentForm");
const studentTable = document.getElementById("studentTable");
const message = document.getElementById("message");

const studentIdInput = document.getElementById("studentId");
const firstName = document.getElementById("first_name");
const lastName = document.getElementById("last_name");
const department = document.getElementById("department");
const roll = document.getElementById("roll");
const session = document.getElementById("session");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const refreshBtn = document.getElementById("refreshBtn");

// Store original roll while editing
let editingRoll = null;

// Error Message
function getErrorMessage(data) {
    if (data.detail) {
        return typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail);
    }

    return "Something went wrong.";
}

// GET All Students
async function loadStudents() {
    refreshBtn.disabled = true;

    studentTable.innerHTML = `
        <tr>
            <td colspan="7">Loading students...</td>
        </tr>
    `;

    try {
        const response = await fetch(STUDENTS_URL);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getErrorMessage(errorData));
        }

        const students = await response.json();

        studentTable.innerHTML = "";

        if (students.length === 0) {
            studentTable.innerHTML = `
                <tr>
                    <td colspan="7">No students found.</td>
                </tr>
            `;
            return;
        }

        students.forEach(student => {
            const row = document.createElement("tr");

            // Session first, Roll second
            const values = [
                student.id,
                student.first_name,
                student.last_name,
                student.department,
                student.session,
                student.roll
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "edit";
            editButton.type = "button";
            editButton.addEventListener("click", () => editStudent(student));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete";
            deleteButton.type = "button";
            deleteButton.addEventListener("click", () => deleteStudent(student.roll));

            actionCell.append(editButton, deleteButton);
            row.appendChild(actionCell);
            studentTable.appendChild(row);
        });

    } catch (error) {
        studentTable.innerHTML = "";

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = `Could not load students: ${error.message}`;

        row.appendChild(cell);
        studentTable.appendChild(row);

    } finally {
        refreshBtn.disabled = false;
    }
}

// Edit Student
function editStudent(student) {
    editingRoll = String(student.roll);

    studentIdInput.value = student.id;
    firstName.value = student.first_name;
    lastName.value = student.last_name;
    department.value = student.department;
    session.value = student.session;
    roll.value = student.roll;

    formTitle.textContent = "Update Student";
    submitBtn.textContent = "Update Student";
    cancelBtn.hidden = false;

    form.scrollIntoView({ behavior: "smooth" });
}

// Reset Form
function resetForm() {
    form.reset();
    studentIdInput.value = "";
    editingRoll = null;

    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "Add Student";
    cancelBtn.hidden = true;
}

// Cancel Edit
cancelBtn.addEventListener("click", () => {
    resetForm();
    message.textContent = "";
});

// CREATE / UPDATE Student
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const student = {
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        department: department.value.trim(),
        session: Number(session.value),
        roll: roll.value.trim()
    };

    if (
        !student.first_name ||
        !student.last_name ||
        !student.department ||
        !student.roll ||
        !session.value ||
        !Number.isInteger(student.session) ||
        student.session < 1
    ) {
        message.textContent = "Please enter valid values in all fields.";
        return;
    }

    const isEditing = editingRoll !== null;

    const url = isEditing
        ? `${STUDENTS_URL}update/${encodeURIComponent(editingRoll)}`
        : `${STUDENTS_URL}create`;

    const method = isEditing ? "PATCH" : "POST";

    submitBtn.disabled = true;
    message.textContent = isEditing
        ? "Updating student..."
        : "Creating student...";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getErrorMessage(errorData));
        }

        message.textContent = isEditing
            ? "Student updated successfully!"
            : "Student created successfully!";

        resetForm();
        await loadStudents();

    } catch (error) {
        message.textContent = error.message;

    } finally {
        submitBtn.disabled = false;
    }
});

// DELETE Student
async function deleteStudent(studentRoll) {
    if (!confirm(`Delete student ${studentRoll}?`)) {
        return;
    }

    try {
        const response = await fetch(
            `${STUDENTS_URL}${encodeURIComponent(studentRoll)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(getErrorMessage(errorData));
        }

        // Reset form if the deleted student is being edited
        if (editingRoll === String(studentRoll)) {
            resetForm();
        }

        message.textContent = "Student deleted successfully!";
        await loadStudents();

    } catch (error) {
        message.textContent = error.message;
    }
}

// Refresh Button
refreshBtn.addEventListener("click", loadStudents);

// Initial Load
loadStudents();
