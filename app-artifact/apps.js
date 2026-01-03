// DevOps Dashboard PWA - Main Application
class DevOpsDashboard {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('devops-tasks')) || [];
        this.currentFilter = 'all';
        this.currentEnv = 'prod';
        this.theme = localStorage.getItem('theme') || 'light';
        this.isSidebarOpen = false;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing DevOps Dashboard...');
        
        // Apply initial theme
        this.applyTheme(this.theme);
        
        // Bind all events
        this.bindEvents();
        
        // Initial render
        this.renderTasks();
        this.updateStats();
        
        // Check online status
        this.updateOnlineStatus();
        
        console.log('✅ DevOps Dashboard ready!');
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeBtn').addEventListener('click', () => this.toggleTheme());
        
        // Menu toggle
        document.getElementById('menuBtn').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('closeBtn').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('overlay').addEventListener('click', () => this.toggleSidebar());
        
        // Add task
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Quick filters
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.currentTarget.dataset.filter));
        });
        
        // Environment selection
        document.querySelectorAll('.env').forEach(env => {
            env.addEventListener('click', (e) => this.selectEnvironment(e.currentTarget));
        });
        
        // Quick actions
        document.getElementById('deployBtn').addEventListener('click', () => this.deploy());
        document.getElementById('testBtn').addEventListener('click', () => this.runTests());
        document.getElementById('backupBtn').addEventListener('click', () => this.backupData());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCompleted());
        
        // Sample tasks
        document.getElementById('addSamples').addEventListener('click', () => this.addSampleTasks());
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.refresh());
        
        // Online/offline events
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
        
        // Touch events for mobile
        this.bindTouchEvents();
    }

    bindTouchEvents() {
        let touchStartY = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            
            // Pull to refresh (pull down)
            if (diff < -100 && window.scrollY === 0) {
                this.refresh();
            }
        });
    }

    // Theme Functions
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme(this.theme);
        this.showToast(`Switched to ${this.theme} mode`);
    }

    updateThemeIcon() {
        const icon = document.querySelector('#themeBtn i');
        icon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Sidebar Functions
    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        if (this.isSidebarOpen) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    selectEnvironment(envElement) {
        document.querySelectorAll('.env').forEach(e => e.classList.remove('active'));
        envElement.classList.add('active');
        this.currentEnv = envElement.dataset.env;
        this.showToast(`Selected ${envElement.querySelector('span').textContent}`);
    }

    // Task Functions
    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        const priority = document.getElementById('prioritySelect').value;
        
        if (!text) {
            this.showToast('Please enter a task', 'warning');
            input.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text,
            priority,
            env: this.currentEnv,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.save();
        this.renderTasks();
        
        input.value = '';
        input.focus();
        
        this.showToast('Task added successfully');
    }

    addSampleTasks() {
        const samples = [
            { text: 'Deploy v3.2.0 to production', priority: 'high' },
            { text: 'Fix API authentication bug', priority: 'critical' },
            { text: 'Update monitoring dashboard', priority: 'normal' },
            { text: 'Run security scan on staging', priority: 'high' },
            { text: 'Optimize database queries', priority: 'normal' },
            { text: 'Update documentation', priority: 'normal' },
            { text: 'Backup production database', priority: 'high' },
            { text: 'Setup CI/CD pipeline for new service', priority: 'critical' }
        ];

        samples.forEach(sample => {
            this.tasks.unshift({
                id: Date.now() + Math.random(),
                text: sample.text,
                priority: sample.priority,
                env: this.currentEnv,
                completed: false,
                createdAt: new Date().toISOString()
            });
        });

        this.save();
        this.renderTasks();
        this.showToast('Sample tasks added');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.save();
            this.renderTasks();
            this.showToast(task.completed ? 'Task completed' : 'Task reopened');
        }
    }

    deleteTask(id, event) {
        if (event) event.stopPropagation();
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.renderTasks();
        this.showToast('Task deleted', 'warning');
    }

    // Filter Functions
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-tag').forEach(btn => {
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

    // Render Functions
    renderTasks() {
        const container = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.add('visible');
            return;
        }

        emptyState.classList.remove('visible');
        
        container.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        // Add event listeners to new task elements
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            const taskId = parseInt(checkbox.closest('.task').dataset.id);
            checkbox.addEventListener('click', () => this.toggleTask(taskId));
        });
        
        this.updateStats();
    }

    createTaskHTML(task) {
        const priorityIcon = task.priority === 'critical' ? 'exclamation-triangle' :
                           task.priority === 'high' ? 'exclamation' : 'circle';
        
        return `
            <div class="task ${task.priority} ${task.completed ? 'completed-item' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHTML(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority ${task.priority}">
                            <i class="fas fa-${priorityIcon}"></i>
                            ${task.priority.toUpperCase()}
                        </span>
                        <span class="task-date">
                            ${this.formatDate(task.createdAt)}
                        </span>
                    </div>
                </div>
                <button class="delete-btn" onclick="dashboard.deleteTask(${task.id}, event)" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.completed).length;
        const pending = total - done;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('doneTasks').textContent = done;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // Quick Actions
    deploy() {
        this.showToast('Deployment started...', 'info');
        setTimeout(() => this.showToast('Deployment successful!'), 2000);
    }

    runTests() {
        this.showToast('Running tests...', 'info');
        setTimeout(() => this.showToast('All tests passed!'), 1500);
    }

    backupData() {
        this.showToast('Creating backup...', 'info');
        setTimeout(() => this.showToast('Backup completed successfully'), 2500);
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showToast('No completed tasks to clear', 'warning');
            return;
        }

        this.tasks = this.tasks.filter(t => !t.completed);
        this.save();
        this.renderTasks();
        this.showToast(`Cleared ${completedCount} completed tasks`, 'success');
    }

    refresh() {
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.classList.add('rotating');
        
        setTimeout(() => {
            refreshBtn.classList.remove('rotating');
            this.updateStats();
            this.updateSyncTime();
            this.showToast('Dashboard refreshed');
        }, 800);
    }

    // Utility Functions
    save() {
        localStorage.setItem('devops-tasks', JSON.stringify(this.tasks));
        this.updateSyncTime();
    }

    updateSyncTime() {
        const syncElement = document.getElementById('lastSync');
        if (syncElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            syncElement.textContent = `Synced: ${timeString}`;
        }
    }

    updateOnlineStatus() {
        const offlineStatus = document.getElementById('offlineStatus');
        if (navigator.onLine) {
            offlineStatus.classList.remove('visible');
        } else {
            offlineStatus.classList.add('visible');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        // Set color based on type
        let color = '#10b981'; // success green
        if (type === 'warning') color = '#f59e0b';
        if (type === 'error') color = '#ef4444';
        if (type === 'info') color = '#3b82f6';

        toast.style.borderLeft = `4px solid ${color}`;
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) return 'Just now';
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // More than 1 day
        const days = Math.floor(diff / 86400000);
        return days === 1 ? 'Yesterday' : `${days}d ago`;
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DevOpsDashboard();
});