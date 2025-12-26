// DevOps Dashboard PWA - Main Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DevOps Dashboard PWA Initializing...');

    // Configuration
    const config = {
        APP_NAME: 'DevOps Dashboard',
        APP_VERSION: '3.0.0',
        STORAGE_KEY: 'devops-dashboard-v3',
        DEBUG: true
    };

    // State Management
    const state = {
        tasks: JSON.parse(localStorage.getItem('devops-tasks')) || [],
        activities: JSON.parse(localStorage.getItem('devops-activities')) || [],
        notifications: [],
        settings: {
            theme: localStorage.getItem('theme') || 'light',
            notifications: true
        },
        stats: {
            deployments: 12,
            uptime: 99.9,
            activeTasks: 0,
            completedTasks: 0
        },
        currentEnv: 'prod',
        isOnline: navigator.onLine,
        currentFilter: 'all',
        sortBy: 'date'
    };

    // DOM Elements
    const elements = {
        // Navigation
        mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
        mobileOverlay: document.getElementById('mobile-overlay'),
        sidebar: document.getElementById('sidebar'),
        sidebarClose: document.getElementById('sidebar-close'),
        themeToggle: document.getElementById('theme-toggle'),
        
        // Task Management
        todoInput: document.getElementById('todo-input'),
        addBtn: document.getElementById('add-btn'),
        prioritySelect: document.getElementById('priority-select'),
        deadlineInput: document.getElementById('task-deadline'),
        todoList: document.getElementById('todo-list'),
        emptyState: document.getElementById('empty-state'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        searchInput: document.getElementById('search-input'),
        searchToggle: document.getElementById('search-toggle'),
        searchBar: document.getElementById('search-bar'),
        clearSearch: document.getElementById('clear-search'),
        taskCount: document.getElementById('task-count'),
        addSampleTasks: document.getElementById('add-sample-tasks'),
        
        // Environment
        envBadges: document.querySelectorAll('.env-badge'),
        
        // Stats
        tasksDone: document.getElementById('tasks-done'),
        deploymentCount: document.getElementById('deployment-count'),
        tasksActive: document.getElementById('tasks-active'),
        
        // Activity
        activityFeed: document.getElementById('activity-feed'),
        refreshActivity: document.getElementById('refresh-activity'),
        
        // Status
        offlineBadge: document.getElementById('offline-badge'),
        
        // Toast & Loading
        toastContainer: document.getElementById('toast-container'),
        loadingSpinner: document.getElementById('loading-spinner')
    };

    // Initialize Application
    function initApp() {
        console.log('🔧 Initializing DevOps Dashboard v' + config.APP_VERSION);
        
        // Load saved state
        loadState();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initial render
        renderTasks();
        updateStats();
        updateActivityFeed();
        updateConnectionStatus();
        updateTheme();
        
        // Check for updates
        checkForUpdates();
        
        console.log('✅ DevOps Dashboard initialized successfully');
    }

    // Setup Event Listeners with mobile touch support
    function setupEventListeners() {
        // Mobile Navigation
        if (elements.mobileMenuToggle) {
            elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        }
        
        if (elements.mobileOverlay) {
            elements.mobileOverlay.addEventListener('click', closeMobileMenu);
        }
        
        if (elements.sidebarClose) {
            elements.sidebarClose.addEventListener('click', closeMobileMenu);
        }

        // Task Management
        if (elements.addBtn) {
            elements.addBtn.addEventListener('click', addTask);
        }
        
        if (elements.todoInput) {
            elements.todoInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') addTask();
            });
        }
        
        if (elements.addSampleTasks) {
            elements.addSampleTasks.addEventListener('click', addSampleTasks);
        }

        // Filter Tasks
        if (elements.filterButtons) {
            elements.filterButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    const filter = this.dataset.filter;
                    state.currentFilter = filter;
                    
                    // Update active button
                    elements.filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    renderTasks();
                });
            });
        }

        // Search Functionality
        if (elements.searchToggle) {
            elements.searchToggle.addEventListener('click', toggleSearch);
        }
        
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', handleSearch);
        }
        
        if (elements.clearSearch) {
            elements.clearSearch.addEventListener('click', clearSearch);
        }

        // Environment Selection
        if (elements.envBadges) {
            elements.envBadges.forEach(badge => {
                badge.addEventListener('click', function() {
                    const env = this.dataset.env;
                    state.currentEnv = env;
                    
                    // Update active badge
                    elements.envBadges.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    showToast('Environment Changed', `Switched to ${this.querySelector('.env-name').textContent}`, 'info');
                });
            });
        }

        // Theme Toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        // Activity Refresh
        if (elements.refreshActivity) {
            elements.refreshActivity.addEventListener('click', updateActivityFeed);
        }

        // Online/Offline Events
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);

        // Before Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const installBtn = document.getElementById('install-btn');
            if (installBtn) {
                installBtn.style.display = 'flex';
                installBtn.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`User response: ${outcome}`);
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    }
                });
            }
        });

        // App Installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            showToast('Installed!', 'DevOps Dashboard installed successfully', 'success');
        });
    }

    // Mobile Navigation Functions
    function toggleMobileMenu() {
        if (elements.sidebar) {
            elements.sidebar.classList.add('active');
        }
        if (elements.mobileOverlay) {
            elements.mobileOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        if (elements.sidebar) {
            elements.sidebar.classList.remove('active');
        }
        if (elements.mobileOverlay) {
            elements.mobileOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    // Task Management Functions
    function addTask() {
        if (!elements.todoInput) return;
        
        const text = elements.todoInput.value.trim();
        const priority = elements.prioritySelect ? elements.prioritySelect.value : 'normal';
        const deadline = elements.deadlineInput ? elements.deadlineInput.value : '';
        
        if (!text) {
            showToast('Empty Task', 'Please enter a task description.', 'error');
            elements.todoInput.focus();
            return;
        }

        const task = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            text: text,
            priority: priority,
            deadline: deadline,
            completed: false,
            createdAt: new Date().toISOString(),
            env: state.currentEnv,
            tags: getTaskTags(text)
        };

        state.tasks.unshift(task);
        saveState();
        renderTasks();
        
        elements.todoInput.value = '';
        elements.todoInput.focus();
        
        showToast('Task Added', 'New DevOps task has been added.', 'success');
        logActivity(`Task added: "${text}" (${priority} priority)`, 'info');
    }

    function getTaskTags(text) {
        const tags = [];
        const textLower = text.toLowerCase();
        
        if (textLower.includes('deploy')) tags.push('deployment');
        if (textLower.includes('test')) tags.push('testing');
        if (textLower.includes('fix') || textLower.includes('bug')) tags.push('bugfix');
        if (textLower.includes('monitor') || textLower.includes('alert')) tags.push('monitoring');
        
        return tags;
    }

    function toggleTaskCompletion(taskId) {
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            state.tasks[taskIndex].completed = !state.tasks[taskIndex].completed;
            state.tasks[taskIndex].completedAt = state.tasks[taskIndex].completed ? new Date().toISOString() : null;
            saveState();
            renderTasks();
            updateStats();
            
            const message = state.tasks[taskIndex].completed ? 'Task completed successfully' : 'Task reopened for work';
            showToast('Task Updated', message, 'success');
        }
    }

    function deleteTask(taskId) {
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const taskText = state.tasks[taskIndex].text;
            state.tasks.splice(taskIndex, 1);
            saveState();
            renderTasks();
            showToast('Task Deleted', 'Task has been removed from the system.', 'success');
            logActivity(`Task deleted: "${taskText}"`, 'warning');
        }
    }

    function editTask(taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && elements.todoInput) {
            elements.todoInput.value = task.text;
            if (elements.prioritySelect) elements.prioritySelect.value = task.priority;
            if (elements.deadlineInput) elements.deadlineInput.value = task.deadline || '';
            elements.todoInput.focus();
            
            // Remove the task
            state.tasks = state.tasks.filter(t => t.id !== taskId);
            saveState();
            renderTasks();
            
            showToast('Edit Mode', 'Task loaded for editing. Update and press Add.', 'info');
        }
    }

    function renderTasks() {
        if (!elements.todoList || !elements.emptyState) return;
        
        let filteredTasks = state.tasks.filter(task => {
            if (state.currentFilter === 'pending') return !task.completed;
            if (state.currentFilter === 'completed') return task.completed;
            return true;
        });

        // Apply search filter if active
        const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchTerm) ||
                task.priority.toLowerCase().includes(searchTerm) ||
                (task.tags && task.tags.some(tag => tag.includes(searchTerm)))
            );
        }

        // Sort tasks by date (newest first)
        filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        elements.todoList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            elements.emptyState.style.display = 'flex';
            if (elements.taskCount) {
                elements.taskCount.textContent = '0 tasks';
            }
            return;
        }
        
        elements.emptyState.style.display = 'none';
        if (elements.taskCount) {
            elements.taskCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.id = task.id;
            li.dataset.priority = task.priority;
            
            const deadlineText = task.deadline ? formatDate(task.deadline, true) : 'No deadline';
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
            const tagsHTML = task.tags ? task.tags.map(tag => `<span class="task-tag ${tag}">${tag}</span>`).join('') : '';
            
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        ${tagsHTML ? `<div class="task-tags">${tagsHTML}</div>` : ''}
                        <div class="task-details">
                            <span class="task-priority ${task.priority}">
                                <i class="fas fa-${getPriorityIcon(task.priority)}"></i>
                                ${task.priority.toUpperCase()}
                            </span>
                            <span class="task-date">
                                <i class="fas fa-calendar"></i>
                                ${formatDate(task.createdAt)}
                            </span>
                            ${task.deadline ? `
                                <span class="task-deadline ${isOverdue ? 'overdue' : ''}">
                                    <i class="fas fa-clock"></i>
                                    ${deadlineText}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" aria-label="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" aria-label="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('click', () => toggleTaskCompletion(task.id));
            
            const editBtn = li.querySelector('.edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTask(task.id);
            });
            
            const deleteBtn = li.querySelector('.delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });
            
            // Add touch feedback for mobile
            li.addEventListener('touchstart', function() {
                this.classList.add('touched');
            });
            
            li.addEventListener('touchend', function() {
                setTimeout(() => this.classList.remove('touched'), 150);
            });
            
            elements.todoList.appendChild(li);
        });
    }

    // Sample Tasks
    function addSampleTasks() {
        const sampleTasks = [
            {
                text: 'Deploy version 3.0.0 to production',
                priority: 'critical',
                deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                tags: ['deployment']
            },
            {
                text: 'Fix authentication bug in API gateway',
                priority: 'high',
                deadline: new Date(Date.now() + 172800000).toISOString().split('T')[0],
                tags: ['bugfix']
            },
            {
                text: 'Update monitoring dashboard with new metrics',
                priority: 'normal',
                deadline: new Date(Date.now() + 259200000).toISOString().split('T')[0],
                tags: ['monitoring']
            },
            {
                text: 'Run security scan on staging environment',
                priority: 'high',
                deadline: new Date(Date.now() + 432000000).toISOString().split('T')[0],
                tags: ['testing']
            }
        ];
        
        sampleTasks.forEach(taskData => {
            const task = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                text: taskData.text,
                priority: taskData.priority,
                deadline: taskData.deadline,
                completed: false,
                createdAt: new Date().toISOString(),
                env: state.currentEnv,
                tags: taskData.tags
            };
            
            state.tasks.push(task);
        });
        
        saveState();
        renderTasks();
        showToast('Sample Tasks Added', '4 sample DevOps tasks have been added.', 'success');
    }

    // State Management
    function loadState() {
        try {
            const savedTasks = localStorage.getItem('devops-tasks');
            const savedActivities = localStorage.getItem('devops-activities');
            
            if (savedTasks) state.tasks = JSON.parse(savedTasks);
            if (savedActivities) state.activities = JSON.parse(savedActivities);
            
            updateStats();
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    function saveState() {
        try {
            localStorage.setItem('devops-tasks', JSON.stringify(state.tasks));
            localStorage.setItem('devops-activities', JSON.stringify(state.activities));
            localStorage.setItem('theme', state.settings.theme);
            
            updateStats();
            updateLastSync();
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    // UI Updates
    function updateStats() {
        const completedTasks = state.tasks.filter(t => t.completed).length;
        const activeTasks = state.tasks.length - completedTasks;
        
        if (elements.tasksDone) {
            elements.tasksDone.textContent = completedTasks;
        }
        
        if (elements.tasksActive) {
            elements.tasksActive.textContent = activeTasks;
        }
    }

    function updateTheme() {
        document.documentElement.setAttribute('data-theme', state.settings.theme);
        
        if (elements.themeToggle) {
            const icon = elements.themeToggle.querySelector('i');
            if (icon) {
                icon.className = state.settings.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }

    function updateConnectionStatus() {
        state.isOnline = navigator.onLine;
        
        if (elements.offlineBadge) {
            if (state.isOnline) {
                elements.offlineBadge.classList.add('hidden');
            } else {
                elements.offlineBadge.classList.remove('hidden');
                showToast('Offline Mode', 'Working with cached data. Some features limited.', 'info');
            }
        }
    }

    function updateLastSync() {
        const lastSync = document.getElementById('last-sync');
        if (lastSync) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            lastSync.innerHTML = `<i class="fas fa-sync"></i> Last synced: ${timeString}`;
        }
    }

    function updateActivityFeed() {
        if (!elements.activityFeed) return;
        
        if (state.activities.length === 0) {
            state.activities = generateSampleActivity();
        }
        
        elements.activityFeed.innerHTML = '';
        
        state.activities.slice(0, 5).forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const iconClass = {
                success: 'fas fa-check-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle',
                deployment: 'fas fa-rocket',
                error: 'fas fa-times-circle'
            }[activity.type] || 'fas fa-info-circle';

            activityItem.innerHTML = `
                <div class="activity-icon ${activity.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <p>${escapeHtml(activity.message)}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            `;
            
            elements.activityFeed.appendChild(activityItem);
        });
    }

    // Theme Management
    function toggleTheme() {
        state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
        updateTheme();
        saveState();
        showToast('Theme Changed', `Switched to ${state.settings.theme} mode`, 'info');
        logActivity(`Theme changed to ${state.settings.theme} mode`, 'info');
    }

    function toggleSearch() {
        if (elements.searchBar) {
            elements.searchBar.classList.toggle('active');
            if (elements.searchBar.classList.contains('active')) {
                setTimeout(() => {
                    if (elements.searchInput) elements.searchInput.focus();
                }, 100);
            }
        }
    }

    function handleSearch() {
        renderTasks();
        if (elements.clearSearch) {
            elements.clearSearch.style.display = elements.searchInput.value ? 'block' : 'none';
        }
    }

    function clearSearch() {
        if (elements.searchInput) {
            elements.searchInput.value = '';
            renderTasks();
            if (elements.clearSearch) {
                elements.clearSearch.style.display = 'none';
            }
        }
    }

    // Toast System
    function showToast(title, message, type = 'info') {
        if (!elements.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;

        elements.toastContainer.appendChild(toast);

        // Add close event
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => toast.remove());

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    // Activity Logging
    function logActivity(message, type = 'info') {
        const activity = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type: type,
            message: message,
            time: 'Just now',
            timestamp: new Date().toISOString()
        };
        
        state.activities.unshift(activity);
        
        // Keep only last 50 activities
        if (state.activities.length > 50) {
            state.activities.pop();
        }
        
        saveState();
        updateActivityFeed();
    }

    function generateSampleActivity() {
        return [
            {
                id: '1',
                type: 'deployment',
                message: `Production deployment v${config.APP_VERSION} completed successfully`,
                time: '2 hours ago',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '2',
                type: 'success',
                message: 'All CI/CD pipeline tests passed',
                time: '3 hours ago',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '3',
                type: 'info',
                message: 'Database maintenance completed',
                time: '5 hours ago',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    // Utility Functions
    function checkForUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }
    }

    function getPriorityIcon(priority) {
        const icons = {
            normal: 'circle',
            high: 'exclamation',
            critical: 'exclamation-triangle'
        };
        return icons[priority] || 'circle';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(isoString, short = false) {
        if (!isoString) return 'No date';
        
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diff = now - date;
            
            if (short) {
                return date.toLocaleDateString();
            }
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            
            return date.toLocaleDateString();
        } catch (e) {
            return 'Invalid date';
        }
    }

    // Initialize the app
    initApp();

    // Handle window resize for responsive design
    window.addEventListener('resize', function() {
        // Close mobile menu on larger screens
        if (window.innerWidth > 1024) {
            closeMobileMenu();
        }
    });

    // Prevent unwanted zoom on mobile
    document.addEventListener('touchmove', function(event) {
        if (event.scale !== 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // Log startup
    console.log(`🚀 ${config.APP_NAME} v${config.APP_VERSION} is ready!`);
});