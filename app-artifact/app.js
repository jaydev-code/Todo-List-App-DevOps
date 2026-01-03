// Minimal DevOps Dashboard
class DevOpsDashboard {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('devops-tasks')) || [];
        this.currentEnv = 'prod';
        this.theme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        // Set theme
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Bind events
        this.bindEvents();
        
        // Initial render
        this.renderTasks();
        this.updateStats();
        
        console.log('🚀 DevOps Dashboard Ready');
    }

    bindEvents() {
        // Menu toggle
        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('active');
            document.getElementById('overlay').classList.add('active');
        });

        // Close sidebar
        document.getElementById('closeBtn').addEventListener('click', this.closeSidebar.bind(this));
        document.getElementById('overlay').addEventListener('click', this.closeSidebar.bind(this));

        // Theme toggle
        document.getElementById('themeBtn').addEventListener('click', () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.theme);
            localStorage.setItem('theme', this.theme);
            this.showToast(`Switched to ${this.theme} mode`);
        });

        // Add task
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Sample tasks
        document.getElementById('addSamples').addEventListener('click', () => this.addSampleTasks());

        // Environment selection
        document.querySelectorAll('.env').forEach(env => {
            env.addEventListener('click', (e) => {
                document.querySelectorAll('.env').forEach(e => e.classList.remove('active'));
                env.classList.add('active');
                this.currentEnv = env.dataset.env;
                this.showToast(`Switched to ${env.querySelector('span').textContent}`);
            });
        });

        // Quick actions
        document.getElementById('deployBtn').addEventListener('click', () => {
            this.showToast(`Deploying to ${this.currentEnv.toUpperCase()}...`, 'warning');
        });

        document.getElementById('testBtn').addEventListener('click', () => {
            this.showToast('Running tests...', 'info');
        });

        // Prevent mobile zoom
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
    }

    closeSidebar() {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (!text) {
            this.showToast('Please enter a task', 'warning');
            return;
        }

        const priority = text.toLowerCase().includes('critical') ? 'critical' : 
                        text.toLowerCase().includes('urgent') ? 'high' : 'normal';

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
        
        this.showToast('Task added');
    }

    addSampleTasks() {
        const samples = [
            'Deploy v3.2.0 to production',
            'Fix API authentication bug - CRITICAL',
            'Update monitoring dashboard',
            'Run security scan on staging',
            'Optimize database queries'
        ];

        samples.forEach(text => {
            const priority = text.toLowerCase().includes('critical') ? 'critical' : 'normal';
            this.tasks.unshift({
                id: Date.now() + Math.random(),
                text,
                priority,
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
            this.save();
            this.renderTasks();
            this.showToast(task.completed ? 'Task completed' : 'Task reopened');
        }
    }

    deleteTask(id, e) {
        e.stopPropagation();
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.renderTasks();
        this.showToast('Task deleted', 'warning');
    }

    renderTasks() {
        const container = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        
        if (this.tasks.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        container.innerHTML = this.tasks.map(task => `
            <div class="task ${task.priority}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="priority ${task.priority}">
                            <i class="fas fa-${task.priority === 'critical' ? 'exclamation-triangle' : 
                                              task.priority === 'high' ? 'exclamation' : 'circle'}"></i>
                            ${task.priority.toUpperCase()}
                        </span>
                        <span class="task-date">
                            ${this.formatDate(task.createdAt)}
                        </span>
                    </div>
                </div>
                <button class="delete-btn" onclick="dashboard.deleteTask(${task.id}, event)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Add click events for checkboxes
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            const taskId = parseInt(checkbox.closest('.task').dataset.id);
            checkbox.addEventListener('click', () => this.toggleTask(taskId));
        });
        
        this.updateStats();
    }

    updateStats() {
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.completed).length;
        
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('doneTasks').textContent = done;
    }

    save() {
        localStorage.setItem('devops-tasks', JSON.stringify(this.tasks));
        this.updateStats();
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = '';
        
        if (type === 'warning') {
            toast.style.borderLeft = '4px solid var(--warning)';
        } else if (type === 'error') {
            toast.style.borderLeft = '4px solid var(--error)';
        } else {
            toast.style.borderLeft = '4px solid var(--success)';
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
const dashboard = new DevOpsDashboard();

// Make dashboard global for event handlers
window.dashboard = dashboard;

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.error);
}