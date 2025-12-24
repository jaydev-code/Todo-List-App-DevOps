document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const offlineBadge = document.getElementById('offline-badge');

    // State management
    let tasks = JSON.parse(localStorage.getItem('devops-tasks')) || [];

    const saveTasks = () => {
        localStorage.setItem('devops-tasks', JSON.stringify(tasks));
        renderTasks();
    };

    const renderTasks = () => {
        todoList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${task}</span>
                <button onclick="deleteTask(${index})">Delete</button>
            `;
            todoList.appendChild(li);
        });
    };

    window.deleteTask = (index) => {
        tasks.splice(index, 1);
        saveTasks();
    };

    addBtn.addEventListener('click', () => {
        const val = todoInput.value.trim();
        if (val) {
            tasks.push(val);
            todoInput.value = '';
            saveTasks();
        }
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBtn.click();
    });

    // Online/Offline status
    window.addEventListener('online', () => offlineBadge.classList.add('hidden'));
    window.addEventListener('offline', () => offlineBadge.classList.remove('hidden'));
    
    if (!navigator.onLine) offlineBadge.classList.remove('hidden');

    renderTasks();
});
