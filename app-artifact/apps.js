class DevOpsDashboard {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('devops-tasks')) || [];
        this.currentFilter = 'all';
        this.currentEnv = 'production';
        this.theme = localStorage.getItem('theme') || 'dark';
        this.isSidebarOpen = false;
        
        this.init();
    }

    init() {
        console.log('🚀 DevOps Dashboard v2.0');
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('loaded');
        }, 800);
        
        // Bind events
        this.bindEvents();
        
        // Initial render
        this.renderTasks();
        this.updateStats();
        
        // Add sample tasks if empty
        if (this.tasks.length === 0) {
            setTimeout(() => this.addSampleTasks(), 1000);
        }
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('closeSidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('overlay').addEventListener('click', () => this.toggleSidebar());
        
        // Task management
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showAddTaskForm());
        document.getElementById('createFirstTask').addEventListener('click', () => this.showAddTaskForm());
        document.getElementById('closeFormBtn').addEventListener('click', () => this.hideAddTaskForm());
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.hideAddTaskForm());
        document.getElementById('saveTaskBtn').addEventListener('click', () => this.saveTask());
        
        // Task filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.currentTarget.dataset.filter));
        });
        
        // Quick actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAction(e.currentTarget.dataset.action));
        });
        
        // Environment selection
        document.querySelectorAll('.env-item').forEach(item => {
            item.addEventListener('click', (e) => this.selectEnvironment(e.currentTarget.dataset.env));
        });
        
        // Environment badge click
        document.getElementById('currentEnv').addEventListener('click', () => this.toggleSidebar());
    }

    // Theme Management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
        this.showToast('Theme changed', 'success');
    }

    updateThemeIcon() {
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Sidebar
    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        if (this.isSidebarOpen) {
            sidebar.classList.add('show');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Environment Management
    selectEnvironment(env) {
        this.currentEnv = env;
        
        // Update active environment
        document.querySelectorAll('.env-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.env-item[data-env="${env}"]`).classList.add('active');
        
        // Update badge
        this.updateEnvironmentBadge();
        
        this.showToast(`Switched to ${env}`, 'success');
        
        // Close sidebar on mobile
        if (window.innerWidth < 768) {
            this.toggleSidebar();
        }
    }

    updateEnvironmentBadge() {
        const badge = document.getElementById('currentEnv');
        const icons = {
            'production': 'fa-server',
            'staging': 'fa-flask',
            'development': 'fa-code'
        };
        
        badge.querySelector('i').className = `fas ${icons[this.currentEnv]}`;
        badge.querySelector('span').textContent = this.currentEnv.charAt(0).toUpperCase() + this.currentEnv.slice(1);
    }

    // Task Management
    showAddTaskForm() {
        document.getElementById('addTaskForm').classList.add('show');
        document.getElementById('taskTitle').focus();
        document.getElementById('emptyState').classList.remove('show');
    }

    hideAddTaskForm() {
        document.getElementById('addTaskForm').classList.remove('show');
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = 'normal';
        document.getElementById('taskEnvironment').value = this.currentEnv;
    }

    saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const environment = document.getElementById('taskEnvironment').value;
        
        if (!title) {
            this.showToast('Please enter task title', 'error');
            return;
        }
        
        const task = {
            id: Date.now().toString(),
            title,
            description,
            priority,
            environment,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.hideAddTaskForm();
        
        this.showToast('Task added successfully', 'success');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            this.showToast(
                task.completed ? 'Task completed' : 'Task reopened',
                task.completed ? 'success' : 'warning'
            );
        }
    }

    deleteTask(taskId) {
        if (confirm('Delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast('Task deleted', 'error');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskEnvironment').value = task.environment;
            
            this.showAddTaskForm();
            
            this.tasks = this.tasks.filter(t => t.id !== taskId);
        }
    }

    // Task Filtering
    setFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'pending':
                return this.tasks.filter(t => !t.completed);
            case 'critical':
                return this.tasks.filter(t => t.priority === 'critical');
            default:
                return this.tasks;
        }
    }

    // Rendering
    renderTasks() {
        const container = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.add('show');
            return;
        }
        
        emptyState.classList.remove('show');
        
        container.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        // Add event listeners
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            const taskId = checkbox.closest('.task-item').dataset.id;
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTask(taskId);
            });
        });
        
        container.querySelectorAll('.task-action-btn.edit').forEach(btn => {
            const taskId = btn.closest('.task-item').dataset.id;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTask(taskId);
            });
        });
        
        container.querySelectorAll('.task-action-btn.delete').forEach(btn => {
            const taskId = btn.closest('.task-item').dataset.id;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(taskId);
            });
        });
    }

    createTaskHTML(task) {
        return `
            <div class="task-item" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title ${task.completed ? 'completed' : ''}">
                        ${this.escapeHTML(task.title)}
                    </div>
                    ${task.description ? `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.3rem;">${this.escapeHTML(task.description)}</p>` : ''}
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span>${task.environment}</span>
                        <span>${this.getTimeAgo(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Stats
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const critical = this.tasks.filter(t => t.priority === 'critical').length;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('criticalTasks').textContent = critical;
    }

    // Quick Actions
    handleQuickAction(action) {
        const messages = {
            deploy: 'Starting deployment...',
            monitor: 'Opening monitoring...',
            backup: 'Starting backup...',
            test: 'Running tests...'
        };
        
        this.showToast(messages[action], 'success');
        
        // Simulate action
        const btn = document.querySelector(`.action-btn[data-action="${action}"]`);
        btn.disabled = true;
        setTimeout(() => btn.disabled = false, 2000);
    }

    // Sample Data
    addSampleTasks() {
        const samples = [
            {
                id: '1',
                title: 'Deploy API Gateway v2.1.0',
                description: 'Deploy new version with rate limiting',
                priority: 'critical',
                environment: 'production',
                completed: true,
                createdAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: '2',
                title: 'Database Migration',
                description: 'Update database schema',
                priority: 'high',
                environment: 'staging',
                completed: false,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: '3',
                title: 'Security Audit',
                description: 'Complete security assessment',
                priority: 'high',
                environment: 'production',
                completed: false,
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: '4',
                title: 'Frontend Optimization',
                description: 'Improve loading performance',
                priority: 'normal',
                environment: 'development',
                completed: false,
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ];
        
        this.tasks = [...samples, ...this.tasks];
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        this.showToast('Sample tasks added', 'success');
    }

    // Utility Functions
    saveTasks() {
        localStorage.setItem('devops-tasks', JSON.stringify(this.tasks));
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}"></i>
                <div>${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = now - past;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DevOpsDashboard();
});