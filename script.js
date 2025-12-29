let tasks = [];
let currentFilter = 'all';

// ================ DOM ELEMENTS ================

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const taskText = document.getElementById('taskText');
const emptyState = document.getElementById('emptyState');
const errorMessage = document.getElementById('errorMessage');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterButtons = document.querySelectorAll('.filter-btn');

// ================ EVENT LISTENERS ================

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateTaskCounter();
    renderTasks();
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
});

taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addTask();
    }
});


clearCompletedBtn.addEventListener('click', clearCompletedTasks);

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));

        button.classList.add('active');

        currentFilter = button.getAttribute('data-filter');
        renderTasks();
    });
});

// ================ TASK MANAGEMENT FUNCTIONS ================

function addTask() {
    const taskText = taskInput.value.trim();

    if (!taskText) {
        showError('Task cannot be empty');
        taskInput.classList.add('error');
        taskInput.focus();
        return;
    }

    clearError();

    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date()
    };

    tasks.push(newTask);

    saveTasks();

    renderTasks();
    updateTaskCounter();

    taskInput.value = '';
    taskInput.focus();
}


function deleteTask(id) {

    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) return;

    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('removing');


        setTimeout(() => {
            tasks.splice(taskIndex, 1);

            saveTasks();
            renderTasks();
            updateTaskCounter();
        }, 300);
    }
}

function toggleTask(id) {

    const task = tasks.find(task => task.id === id);

    if (task) {
        task.completed = !task.completed;

        saveTasks();
        updateTaskCounter();


        if (currentFilter !== 'all') {
            renderTasks();
        }
    }
}


function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
    updateTaskCounter();
}


function updateTaskCounter() {

    const activeTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = activeTasks;
    taskText.textContent = activeTasks === 1 ? 'task left' : 'tasks left';
}


function renderTasks() {

    taskList.innerHTML = '';


    let filteredTasks = tasks;

    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');


        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
}


function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', task.id);

    li.innerHTML = `
        <div class="task-content">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}
                   aria-label="${task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}">
            <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
        <div class="task-actions">
            <button class="delete-btn" aria-label="Delete task">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;


    const checkbox = li.querySelector('.task-checkbox');
    const deleteBtn = li.querySelector('.delete-btn');

    checkbox.addEventListener('change', () => toggleTask(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return li;
}

// ================ HELPER FUNCTIONS ================
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');

    setTimeout(clearError, 3000);
}


function clearError() {
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
    taskInput.classList.remove('error');
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================ LOCAL STORAGE FUNCTIONS ================

function saveTasks() {
    try {
        localStorage.setItem('todo-tasks', JSON.stringify(tasks));
        localStorage.setItem('todo-filter', currentFilter);
    } catch (error) {
        console.error('Failed to save tasks:', error);
    }
}

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem('todo-tasks');
        const savedFilter = localStorage.getItem('todo-filter');

        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }

        if (savedFilter) {
            currentFilter = savedFilter;

            filterButtons.forEach(button => {
                if (button.getAttribute('data-filter') === currentFilter) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
}

// ================ KEYBOARD SHORTCUTS ================

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' &&
        document.activeElement === taskInput) {
        addTask();
    }


    if (e.key === 'Escape' && document.activeElement === taskInput) {
        taskInput.value = '';
        clearError();
    }

    if (!e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
            setFilter('all');
        } else if (e.key === '2') {
            setFilter('active');
        } else if (e.key === '3') {
            setFilter('completed');
        }
    }
});


function setFilter(filter) {
    currentFilter = filter;

    filterButtons.forEach(button => {
        if (button.getAttribute('data-filter') === filter) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Re-render tasks
    renderTasks();
}

// ================ ACCESSIBILITY FEATURES ================
taskInput.focus();
