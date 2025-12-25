document.addEventListener('DOMContentLoaded', () => {
    // FIX: Handle localStorage for online/offline
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    // FIX: Try-catch for localStorage errors
    let storedTasks = [];
    try {
        storedTasks = JSON.parse(localStorage.getItem('devops-tasks')) || [];
    } catch (e) {
        console.log('LocalStorage error, using empty tasks');
        storedTasks = [];
    }

    const state = {
        tasks: storedTasks,
        filter: 'all',
        theme: 'light' // Default theme
    };

    // Try to get saved theme
    try {
        state.theme = localStorage.getItem('devops-theme') || 'light';
    } catch (e) {
        // If localStorage fails, use default
    }

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
        console.log('Initializing app...');
        
        // Set theme immediately
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
        
        // Load sample activity (NOW ONLY IN JAVASCRIPT)
        loadSampleActivity();
    }

    function setupEventListeners() {
        // Task management
        if (elements.addBtn) {
            elements.addBtn.addEventListener('click', addTask);
        }
        
        if (elements.todoInput) {
            elements.todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addTask();
            });
        }

        // Filter tasks
        if (elements.filterButtons) {
            elements.filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    elements.filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    state.filter = btn.dataset.filter;
                    renderTasks();
                });
            });
        }

        // Theme toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        // Quick actions
        const quickDeploy = document.getElementById('quick-deploy');
        const runTests = document.getElementById('run-tests');
        const backupNow = document.getElementById('backup-now');
        
        if (quickDeploy) quickDeploy.addEventListener('click', () => {
            showToast('Deployment Started', 'Staging deployment has been initiated.', 'info');
            logActivity('Staging deployment initiated');
        });
        
        if (runTests) runTests.addEventListener('click', () => {
            showToast('Tests Running', 'Test suite execution started.', 'info');
            logActivity('Test suite execution started');
        });
        
        if (backupNow) backupNow.addEventListener('click', () => {
            showToast('Backup Started', 'System backup initiated.', 'info');
            logActivity('System backup initiated');
        });

        // Online/offline status
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
    }

    // Task Management
    function addTask() {
        const text = elements.todoInput?.value.trim();
        const priority = elements.prioritySelect?.value || 'normal';
        
        if (!text) {
            showToast('Empty Task', 'Please enter a task description.', 'error');
            elements.todoInput?.focus();
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
        
        if (elements.todoInput) {
            elements.todoInput.value = '';
            elements.todoInput.focus();
        }
        
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
        try {
            localStorage.setItem('devops-tasks', JSON.stringify(state.tasks));
        } catch (e) {
            console.log('Failed to save tasks to localStorage');
        }
        updateStats();
        updateSyncTime();
    }

    function renderTasks() {
        if (!elements.todoList || !elements.emptyState) return;
        
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
            
            // FIX: Ensure priority is always defined
            const priority = task.priority || 'normal';
            
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${priority}">${priority.toUpperCase()}</span>
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
        
        try {
            localStorage.setItem('devops-theme', state.theme);
        } catch (e) {
            // If localStorage fails, continue without saving
            console.log('Failed to save theme preference');
        }
        
        updateThemeIcon();
    }

    function updateThemeIcon() {
        if (!elements.themeToggle) return;
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            icon.className = state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    // Status Management
    function updateConnectionStatus() {
        const isOnline = navigator.onLine;
        
        if (elements.offlineBadge) {
            if (isOnline) {
                elements.offlineBadge.classList.add('hidden');
            } else {
                elements.offlineBadge.classList.remove('hidden');
            }
        }
        
        if (elements.statusDot) {
            elements.statusDot.className = isOnline ? 'status-dot online' : 'status-dot offline';
        }
        
        if (elements.statusText) {
            elements.statusText.textContent = isOnline ? 'Online' : 'Offline';
        }
        
        if (elements.systemStatus) {
            elements.systemStatus.textContent = isOnline ? 'All Systems Operational' : 'Limited Connectivity';
            elements.systemStatus.className = isOnline ? 'status-text online' : 'status-text offline';
        }
        
        if (!isOnline) {
            showToast('Offline Mode', 'Working with cached data.', 'info');
        }
    }

    // Stats and Analytics
    function updateStats() {
        const completedTasks = state.tasks.filter(t => t.completed).length;
        
        if (elements.tasksDone) {
            elements.tasksDone.textContent = completedTasks;
        }
        
        if (elements.deploymentCount) {
            // Consistent deployment count for online/offline
            const deploymentCount = 12; // Fixed number for consistency
            elements.deploymentCount.textContent = deploymentCount;
        }
    }

    function updateSyncTime() {
        if (!elements.lastSync) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        elements.lastSync.innerHTML = `<i class="fas fa-sync"></i> Last synced: ${timeString}`;
    }

    // Activity Log - NOW ONLY IN JAVASCRIPT
    function loadSampleActivity() {
        if (!elements.activityFeed) return;
        
        // Clear any existing activities (including hardcoded ones)
        elements.activityFeed.innerHTML = '';
        
        // Consistent sample data for online/offline
        const sampleActivities = [
            { 
                type: 'success', 
                message: 'Production deployment v2.1.0 completed successfully', 
                time: 'Just now'
            },
            { 
                type: 'warning', 
                message: 'Security scan detected 2 low severity vulnerabilities', 
                time: '15 minutes ago' 
            },
            { 
                type: 'info', 
                message: 'New pull request #42 merged to main branch', 
                time: '1 hour ago' 
            },
            { 
                type: 'success', 
                message: 'All CI/CD pipeline tests passed', 
                time: '2 hours ago' 
            },
            { 
                type: 'info', 
                message: 'Daily database backup completed', 
                time: '4 hours ago' 
            }
        ];

        // Add activities in reverse order (newest first)
        sampleActivities.reverse().forEach(activity => {
            addActivityItem(activity.type, activity.message, activity.time);
        });
    }

    function logActivity(message) {
        const now = new Date();
        const timeString = 'Just now';
        addActivityItem('info', message, timeString);
    }

    function addActivityItem(type, message, time) {
        if (!elements.activityFeed) return;
        
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
        if (!container) return;
        
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(isoString) {
        if (!isoString) return 'Just now';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Just now';
        }
    }

    // Expose functions to global scope
    window.app = {
        toggleTask: toggleTaskCompletion,
        deleteTask: deleteTask,
        showToast: showToast
    };
});