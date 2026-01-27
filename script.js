// ===== VARIABLES =====
let todos = []; // Store all tasks
let currentFilter = 'all'; // Current view
let isLightTheme = false; // Theme state

// ===== DOM ELEMENTS =====
const todoForm = document.getElementById('todoForm');
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const errorMsg = document.getElementById('errorMsg');
const emptyState = document.getElementById('emptyState');
const demoBtn = document.getElementById('demoBtn');
const clearCompletedBtn = document.getElementById('clearCompleted');
const themeToggle = document.getElementById('themeToggle');
const taskCounter = document.getElementById('taskCounter');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const filterBtns = document.querySelectorAll('.filter-btn');

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', function() {
    console.log('App starting...');
    
    // Load saved data
    loadFromStorage();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial render
    renderTasks();
    updateCounters();
    
    // Focus input
    taskInput.focus();
    
    console.log('App ready!');
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Form submission
    todoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addTask();
    });
    
    // Enter key
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });
    
    // Demo tasks
    demoBtn.addEventListener('click', addDemoTasks);
    
    // Clear completed
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter
            currentFilter = this.dataset.filter;
            localStorage.setItem('todoFilter', currentFilter);
            
            // Re-render
            renderTasks();
        });
    });
    
    // Event delegation for task list
    taskList.addEventListener('click', handleTaskClick);
    
    // Double-click to edit
    taskList.addEventListener('dblclick', function(e) {
        if (e.target.classList.contains('task-text')) {
            const taskId = e.target.closest('.task-item').dataset.id;
            startEdit(taskId);
        }
    });
}

// Handle clicks on tasks
function handleTaskClick(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;
    
    // Delete button
    if (e.target.classList.contains('delete-btn') || 
        e.target.closest('.delete-btn')) {
        deleteTask(taskId);
    }
    
    // Edit button
    else if (e.target.classList.contains('edit-btn') ||
             e.target.closest('.edit-btn')) {
        startEdit(taskId);
    }
    
    // Checkbox
    else if (e.target.classList.contains('task-checkbox') ||
             e.target.closest('.task-checkbox')) {
        toggleTask(taskId);
    }
}

// ===== TASK FUNCTIONS =====

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    
    // Validation
    if (!text) {
        showError('Please enter a task');
        return;
    }
    
    // Create task
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString()
    };
    
    // Add to array
    todos.push(task);
    
    // Save and update
    saveToStorage();
    renderTasks();
    updateCounters();
    
    // Clear input
    taskInput.value = '';
    taskInput.focus();
    hideError();
    
    console.log('Task added:', text);
}

// Delete task
function deleteTask(id) {
    // Find index
    let index = -1;
    for (let i = 0; i < todos.length; i++) {
        if (todos[i].id == id) {
            index = i;
            break;
        }
    }
    
    if (index === -1) return;
    
    // Remove from array
    todos.splice(index, 1);
    
    // Save and update
    saveToStorage();
    renderTasks();
    updateCounters();
}

// Toggle task completion
function toggleTask(id) {
    // Find task
    for (let i = 0; i < todos.length; i++) {
        if (todos[i].id == id) {
            todos[i].completed = !todos[i].completed;
            break;
        }
    }
    
    saveToStorage();
    updateCounters();
    
    // Re-render if filtered
    if (currentFilter !== 'all') {
        renderTasks();
    }
}

// Clear completed tasks
function clearCompletedTasks() {
    // Keep only active tasks
    const activeTasks = todos.filter(task => !task.completed);
    
    if (activeTasks.length === todos.length) {
        showMessage('No completed tasks to clear');
        return;
    }
    
    todos = activeTasks;
    saveToStorage();
    renderTasks();
    updateCounters();
    showMessage('Completed tasks cleared');
}

// Start editing a task
function startEdit(taskId) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    if (!taskElement) return;
    
    const taskTextElement = taskElement.querySelector('.task-text');
    const currentText = task.text;
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = currentText;
    
    // Replace text
    taskTextElement.replaceWith(input);
    input.focus();
    input.select();
    
    // Save function
    function saveEdit() {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            task.text = newText;
            saveToStorage();
            renderTasks();
            showMessage('Task updated');
        } else {
            renderTasks(); // Cancel
        }
    }
    
    // Events
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            renderTasks(); // Cancel
        }
    });
}

// ===== RENDER FUNCTIONS =====

// Render tasks based on filter
function renderTasks() {
    // Clear list
    taskList.innerHTML = '';
    
    // Filter tasks
    let filteredTasks = todos;
    if (currentFilter === 'active') {
        filteredTasks = todos.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = todos.filter(task => task.completed);
    }
    
    // Show/hide empty state
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        taskList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        taskList.style.display = 'block';
        
        // Create task elements
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${escapeHtml(task.text)}</span>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            taskList.appendChild(li);
        });
    }
}

// Update all counters
function updateCounters() {
    const total = todos.length;
    const active = todos.filter(task => !task.completed).length;
    const completed = total - active;
    
    // Update displays
    taskCounter.textContent = active;
    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
}

// ===== THEME FUNCTIONS =====

// Toggle theme
function toggleTheme() {
    isLightTheme = !isLightTheme;
    
    if (isLightTheme) {
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
    } else {
        document.body.classList.remove('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
    }
    
    // Save preference
    localStorage.setItem('todoTheme', isLightTheme ? 'light' : 'dark');
}

// ===== STORAGE FUNCTIONS =====

// Save to localStorage
function saveToStorage() {
    try {
        localStorage.setItem('todoAppData', JSON.stringify(todos));
    } catch (error) {
        console.error('Save error:', error);
    }
}

// Load from localStorage
function loadFromStorage() {
    try {
        // Load tasks
        const savedTasks = localStorage.getItem('todoAppData');
        if (savedTasks) {
            todos = JSON.parse(savedTasks);
            console.log('Loaded', todos.length, 'tasks');
        }
        
        // Load filter
        const savedFilter = localStorage.getItem('todoFilter');
        if (savedFilter) {
            currentFilter = savedFilter;
            filterBtns.forEach(btn => {
                if (btn.dataset.filter === currentFilter) {
                    btn.classList.add('active');
                }
            });
        }
        
        // Load theme
        const savedTheme = localStorage.getItem('todoTheme');
        if (savedTheme === 'light') {
            isLightTheme = true;
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
        }
    } catch (error) {
        console.error('Load error:', error);
        todos = [];
    }
}

// ===== HELPER FUNCTIONS =====

// Show error
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
    
    setTimeout(() => {
        errorMsg.classList.remove('show');
    }, 3000);
}

// Hide error
function hideError() {
    errorMsg.classList.remove('show');
}

// Show message
function showMessage(message) {
    // Create message element
    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(msg);
    
    // Remove after 2 seconds
    setTimeout(() => {
        msg.remove();
    }, 2000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== DEMO TASKS =====

// Add demo tasks
function addDemoTasks() {
    const demoTasks = [
        "Learn JavaScript fundamentals",
        "Build this todo app",
        "Add localStorage functionality",
        "Implement task filtering",
        "Test edit-in-place feature",
        "Make it responsive for mobile",
        "Submit the project"
    ];
    
    demoTasks.forEach((text, index) => {
        const task = {
            id: Date.now() + index,
            text: text,
            completed: index > 3, // First 4 active, rest completed
            createdAt: new Date().toLocaleString()
        };
        todos.push(task);
    });
    
    saveToStorage();
    renderTasks();
    updateCounters();
    showMessage('Demo tasks added!');
}

// ===== DEBUGGING HELPERS =====

// For testing in console
window.todoDebug = {
    getTasks: () => todos,
    addTest: addDemoTasks,
    clearAll: () => {
        todos = [];
        saveToStorage();
        renderTasks();
        updateCounters();
    },
    addTask: (text) => {
        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleString()
        };
        todos.push(task);
        saveToStorage();
        renderTasks();
        updateCounters();
    }
};

console.log('To-Do App loaded successfully!');
console.log('Type todoDebug.addTest() to add demo tasks');
console.log('Type todoDebug.getTasks() to see all tasks');
