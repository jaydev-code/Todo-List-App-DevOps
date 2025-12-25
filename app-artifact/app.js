document.addEventListener('DOMContentLoaded', () => {
    // Initialize state
    const state = {
        tasks: JSON.parse(localStorage.getItem('devops-tasks')) || [],
        filter: 'all',
        theme: localStorage.getItem('theme') || 'light'
    };

    // DOM Elements
    const elements = {
        todoInput: document.getElementById('todo-input'),
        addBtn: document.getElementById('add-btn'),
        todoList: document.getElementById('todo-list'),
        offlineBadge: document.getElementById('offline-badge'),
        themeToggle: document.getElementById('theme-toggle'),
        statusIndicator: document.getElementById('status-indicator'),
        statusDot: document.querySelector('.status-dot'),
        statusText: document.querySelector('.status-text'),
        systemStatus: document.getElementById('system-status'),
        tasksDone: document.getElementById('tasks-done'),
        deploymentCount: document.getElementById('deployment-count'),
        lastSync: document.getElementById('last-sync'),
        emptyState: document.getElementById('empty-state'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        prioritySelect: document.getElementById('priority-select'),
        activityFeed: document.getElementById('activity-feed')
    };

    // Initialize app
    initApp();

    function initApp() {
        // Set theme
        document.documentElement.setAttribute('data-theme', state.theme);
        updateThemeIcon();
        
        // Render initial state
        renderTasks();
        updateStats();
        updateSyncTime();
        
        // Event listeners
        setupEventListeners();
        
        // Check online status
        updateConnectionStatus();
        
        // Load sample activity
        loadSampleActivity();
    }

    function setupEventListeners() {
        // Task management
        elements.addBtn.addEventListener('click', addTask);
        elements.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Filter tasks
        elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.filter = btn.dataset.filter;
                renderTasks();
            });
        });

        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Quick actions
        document.getElementById('quick-deploy')?.addEventListener('click', () => {
            showToast('Deployment Started', 'Staging deployment has been initiated.', 'info');
            logActivity('Staging deployment initiated');
        });

        document.getElementById('run-tests')?.addEventListener('click', () => {
            showToast('Tests Running', 'Test suite execution started.', 'info');
            logActivity('Test suite execution started');
        });

        document.getElementById('backup-now')?.addEventListener('click', () => {
            showToast('Backup Started', 'System backup initiated.', 'info');
            logActivity('System backup initiated');
        });

        // Online/offline status
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
    }

    // Task Management
    function addTask() {
        const text = elements.todoInput.value.trim();
        const priority = elements.prioritySelect.value;
        
        if (!text) {
            showToast('Empty Task', 'Please enter a task description.', 'error');
            elements.todoInput.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        state.tasks.unshift(task);
        saveTasks();
        renderTasks();
        
        elements.todoInput.value = '';
        elements.todoInput.focus();
        
        showToast('Task Added', 'New DevOps task has been added.', 'success');
        logActivity(`Task added: "${text}"`);
    }

    function toggleTaskCompletion(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            showToast(
                task.completed ? 'Task Completed' : 'Task Reopened',
                task.completed ? 'Task marked as completed.' : 'Task reopened.',
                'success'
            );
            logActivity(`Task ${task.completed ? 'completed' : 'reopened'}: "${task.text}"`);
        }
    }

    function deleteTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            showToast('Task Deleted', 'Task has been removed.', 'success');
            logActivity(`Task deleted: "${task.text}"`);
        }
    }

    function saveTasks() {
        localStorage.setItem('devops-tasks', JSON.stringify(state.tasks));
        updateStats();
        updateSyncTime();
    }

    function renderTasks() {
        const filteredTasks = state.tasks.filter(task => {
            if (state.filter === 'pending') return !task.completed;
            if (state.filter === 'completed') return task.completed;
            return true;
        });

        elements.todoList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            elements.emptyState.style.display = 'block';
            return;
        }
        
        elements.emptyState.style.display = 'none';

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${task.priority.toUpperCase()}</span>
                        <span>${formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn delete" onclick="app.deleteTask(${task.id})" aria-label="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            elements.todoList.appendChild(li);
        });
    }

    // Theme Management
    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const icon = elements.themeToggle.querySelector('i');
        icon.className = state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Status Management
    function updateConnectionStatus() {
        const isOnline = navigator.onLine;
        
        if (isOnline) {
            elements.offlineBadge.classList.add('hidden');
            elements.statusDot.className = 'status-dot online';
            elements.statusText.textContent = 'Online';
            elements.systemStatus.textContent = 'All Systems Operational';
            elements.systemStatus.className = 'status-text online';
        } else {
            elements.offlineBadge.classList.remove('hidden');
            elements.statusDot.className = 'status-dot offline';
            elements.statusText.textContent = 'Offline';
            elements.systemStatus.textContent = 'Limited Connectivity';
            elements.systemStatus.className = 'status-text offline';
            showToast('Offline Mode', 'Working with cached data.', 'info');
        }
    }

    // Stats and Analytics
    function updateStats() {
        const completedTasks = state.tasks.filter(t => t.completed).length;
        elements.tasksDone.textContent = completedTasks;
        
        // Simulate deployment count (in real app, this would come from API)
        const deploymentCount = Math.floor(Math.random() * 5) + 10;
        elements.deploymentCount.textContent = deploymentCount;
    }

    function updateSyncTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        elements.lastSync.innerHTML = `<i class="fas fa-sync"></i> Last synced: ${timeString}`;
    }

    // Activity Log
    function loadSampleActivity() {
        const sampleActivities = [
            { type: 'success', message: 'Production deployment completed successfully', time: '2 minutes ago' },
            { type: 'warning', message: 'Security scan detected 2 vulnerabilities', time: '15 minutes ago' },
            { type: 'info', message: 'New pull request merged to main branch', time: '1 hour ago' },
            { type: 'success', message: 'All automated tests passed', time: '2 hours ago' },
            { type: 'info', message: 'Database backup completed', time: '4 hours ago' }
        ];

        sampleActivities.forEach(activity => {
            addActivityItem(activity.type, activity.message, activity.time);
        });
    }

    function logActivity(message) {
        const now = new Date();
        const timeString = 'Just now';
        addActivityItem('info', message, timeString);
    }

    function addActivityItem(type, message, time) {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const iconClass = {
            success: 'fas fa-check',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';

        activityItem.innerHTML = `
            <div class="activity-icon ${type}">
                <i class="${iconClass}"></i>
            </div>
            <div class="activity-content">
                <p>${escapeHtml(message)}</p>
                <span class="activity-time">${time}</span>
            </div>
        `;
        
        elements.activityFeed.insertBefore(activityItem, elements.activityFeed.firstChild);
        
        // Limit to 10 activities
        if (elements.activityFeed.children.length > 10) {
            elements.activityFeed.removeChild(elements.activityFeed.lastChild);
        }
    }

    // Toast Notifications
    function showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';

        toast.innerHTML = `
            <i class="${icon}"></i>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
        `;

        container.appendChild(toast);

        // Remove toast after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // Utility Functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Expose functions to global scope for onclick handlers
    window.app = {
        toggleTask: toggleTaskCompletion,
        deleteTask: deleteTask,
        showToast: showToast
    };
});