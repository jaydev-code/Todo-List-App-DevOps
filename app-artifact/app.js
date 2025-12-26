// DevOps Dashboard PWA - Main Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DevOps Dashboard PWA Initializing...');

    // Configuration
    const config = {
        APP_NAME: 'DevOps Dashboard',
        APP_VERSION: '3.0.0',
        STORAGE_KEY: 'devops-dashboard-v3',
        CACHE_NAME: 'devops-dashboard-cache-v3',
        API_BASE_URL: 'https://api.example.com', // Replace with your API
        OFFLINE_MODE: false,
        DEBUG: true
    };

    // State Management
    const state = {
        tasks: [],
        activity: [],
        settings: {
            theme: 'light',
            notifications: true,
            autoSync: true
        },
        stats: {
            deployments: 12,
            uptime: 99.9,
            activeTasks: 0,
            completedTasks: 0
        },
        currentEnv: 'prod',
        isOnline: navigator.onLine,
        isLoading: false,
        isInstalled: false
    };

    // DOM Elements Cache
    const elements = {
        // Navigation
        mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
        mobileOverlay: document.getElementById('mobile-overlay'),
        sidebar: document.getElementById('sidebar'),
        sidebarClose: document.getElementById('sidebar-close'),
        themeToggle: document.getElementById('theme-toggle'),
        installBtn: document.getElementById('install-btn'),
        
        // Task Management
        todoInput: document.getElementById('todo-input'),
        addBtn: document.getElementById('add-btn'),
        prioritySelect: document.getElementById('priority-select'),
        todoList: document.getElementById('todo-list'),
        emptyState: document.getElementById('empty-state'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        searchInput: document.getElementById('search-input'),
        searchToggle: document.getElementById('search-toggle'),
        searchBar: document.getElementById('search-bar'),
        clearSearch: document.getElementById('clear-search'),
        
        // Environment
        envBadges: document.querySelectorAll('.env-badge'),
        
        // Quick Actions
        quickDeploy: document.getElementById('quick-deploy'),
        runTests: document.getElementById('run-tests'),
        backupNow: document.getElementById('backup-now'),
        clearCompleted: document.getElementById('clear-completed'),
        
        // Stats
        tasksDone: document.getElementById('tasks-done'),
        deploymentCount: document.getElementById('deployment-count'),
        tasksActive: document.getElementById('tasks-active'),
        
        // Activity
        activityFeed: document.getElementById('activity-feed'),
        refreshActivity: document.getElementById('refresh-activity'),
        
        // Status & Footer
        statusIndicator: document.getElementById('status-indicator'),
        statusDot: document.querySelector('.status-dot'),
        statusText: document.querySelector('.status-text'),
        systemStatus: document.getElementById('system-status'),
        versionTag: document.getElementById('version-tag'),
        lastSync: document.getElementById('last-sync'),
        offlineBadge: document.getElementById('offline-badge'),
        
        // Misc
        toastContainer: document.getElementById('toast-container'),
        loadingSpinner: document.getElementById('loading-spinner')
    };

    // Initialize Application
    function initApp() {
        if (config.DEBUG) console.log('🔧 Initializing DevOps Dashboard...');
        
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
        updateSyncTime();
        
        // Check for updates
        checkForUpdates();
        
        if (config.DEBUG) console.log('✅ DevOps Dashboard initialized successfully');
    }

    // Setup Event Listeners
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
            elements.todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addTask();
            });
        }

        // Filter Tasks
        elements.filterButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.filter = btn.dataset.filter;
                renderTasks();
            });
        });

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
        elements.envBadges?.forEach(badge => {
            badge.addEventListener('click', () => {
                elements.envBadges.forEach(b => b.classList.remove('active'));
                badge.classList.add('active');
                state.currentEnv = badge.dataset.env;
                logActivity(`Switched to ${badge.textContent.trim()} environment`);
                showToast(`Environment Changed`, `Now viewing ${badge.textContent.trim()}`, 'info');
            });
        });

        // Quick Actions
        if (elements.quickDeploy) {
            elements.quickDeploy.addEventListener('click', () => {
                simulateDeployment();
            });
        }
        
        if (elements.runTests) {
            elements.runTests.addEventListener('click', () => {
                runTests();
            });
        }
        
        if (elements.backupNow) {
            elements.backupNow.addEventListener('click', () => {
                createBackup();
            });
        }
        
        if (elements.clearCompleted) {
            elements.clearCompleted.addEventListener('click', () => {
                clearCompletedTasks();
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

        // Visibility Change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                updateSyncTime();
            }
        });

        // Before Install Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            state.deferredPrompt = e;
            if (elements.installBtn) {
                elements.installBtn.style.display = 'block';
                elements.installBtn.addEventListener('click', installPWA);
            }
        });

        // App Installed
        window.addEventListener('appinstalled', () => {
            state.isInstalled = true;
            if (elements.installBtn) {
                elements.installBtn.style.display = 'none';
            }
            logActivity('PWA installed successfully');
            showToast('App Installed', 'DevOps Dashboard installed successfully!', 'success');
        });
    }

    // Task Management Functions
    function addTask() {
        const text = elements.todoInput?.value.trim();
        const priority = elements.prioritySelect?.value || 'normal';
        
        if (!text) {
            showToast('Empty Task', 'Please enter a task description.', 'error');
            elements.todoInput?.focus();
            return;
        }

        const task = {
            id: Date.now() + Math.random(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            env: state.currentEnv,
            assignedTo: 'devops-team'
        };

        state.tasks.unshift(task);
        saveState();
        renderTasks();
        
        if (elements.todoInput) {
            elements.todoInput.value = '';
            elements.todoInput.focus();
        }
        
        showToast('Task Added', 'New DevOps task has been added.', 'success');
        logActivity(`Task added: "${text}" (${priority} priority)`);
    }

    function toggleTaskCompletion(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveState();
            renderTasks();
            
            const message = task.completed ? 'Task completed successfully' : 'Task reopened for work';
            showToast(
                task.completed ? 'Task Completed' : 'Task Reopened',
                message,
                'success'
            );
            logActivity(`Task ${task.completed ? 'completed' : 'reopened'}: "${task.text}"`);
        }
    }

    function deleteTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveState();
            renderTasks();
            showToast('Task Deleted', 'Task has been removed from the system.', 'success');
            logActivity(`Task deleted: "${task.text}"`);
        }
    }

    function renderTasks() {
        if (!elements.todoList || !elements.emptyState) return;
        
        let filteredTasks = state.tasks.filter(task => {
            if (state.filter === 'pending') return !task.completed;
            if (state.filter === 'completed') return task.completed;
            return true;
        });

        // Apply search filter if active
        const searchTerm = elements.searchInput?.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchTerm) ||
                task.priority.toLowerCase().includes(searchTerm)
            );
        }

        elements.todoList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            elements.emptyState.style.display = 'block';
            return;
        }
        
        elements.emptyState.style.display = 'none';

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.id = task.id;
            
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="window.app.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">
                            <i class="fas fa-${getPriorityIcon(task.priority)}"></i>
                            ${task.priority.toUpperCase()}
                        </span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(task.createdAt)}</span>
                        <span><i class="fas fa-server"></i> ${task.env}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="window.app.editTask(${task.id})" aria-label="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="window.app.deleteTask(${task.id})" aria-label="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            elements.todoList.appendChild(li);
        });
    }

    // DevOps Operations
    function simulateDeployment() {
        showLoading();
        logActivity(`Starting deployment to ${state.currentEnv} environment`);
        
        setTimeout(() => {
            hideLoading();
            state.stats.deployments++;
            updateStats();
            showToast('Deployment Started', `Deploying to ${state.currentEnv}...`, 'info');
            
            setTimeout(() => {
                showToast('Deployment Complete', `Successfully deployed to ${state.currentEnv}!`, 'success');
                logActivity(`Deployment to ${state.currentEnv} completed successfully`);
                updateActivityFeed();
            }, 2000);
        }, 1500);
    }

    function runTests() {
        showLoading();
        logActivity('Running test suite');
        
        setTimeout(() => {
            hideLoading();
            const passed = Math.random() > 0.2; // 80% success rate
            
            if (passed) {
                showToast('Tests Passed', 'All tests completed successfully!', 'success');
                logActivity('Test suite passed all checks');
            } else {
                showToast('Tests Failed', 'Some tests failed. Check logs.', 'error');
                logActivity('Test suite failed with errors');
            }
        }, 3000);
    }

    function createBackup() {
        showLoading();
        logActivity('Creating system backup');
        
        setTimeout(() => {
            hideLoading();
            showToast('Backup Created', 'System backup completed successfully.', 'success');
            logActivity('System backup created and verified');
        }, 2500);
    }

    function clearCompletedTasks() {
        const completedCount = state.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            showToast('No Tasks', 'No completed tasks to clear.', 'info');
            return;
        }
        
        if (confirm(`Clear ${completedCount} completed tasks?`)) {
            state.tasks = state.tasks.filter(t => !t.completed);
            saveState();
            renderTasks();
            showToast('Tasks Cleared', `${completedCount} tasks removed.`, 'success');
            logActivity(`Cleared ${completedCount} completed tasks`);
        }
    }

    // State Management
    function loadState() {
        try {
            const saved = localStorage.getItem(config.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                state.tasks = data.tasks || [];
                state.settings = data.settings || state.settings;
                state.stats = data.stats || state.stats;
                state.currentEnv = data.currentEnv || 'prod';
                
                // Update UI from saved state
                updateTheme();
                updateEnvBadges();
            }
        } catch (error) {
            console.error('Error loading state:', error);
            // Use default state
        }
    }

    function saveState() {
        try {
            localStorage.setItem(config.STORAGE_KEY, JSON.stringify({
                tasks: state.tasks,
                settings: state.settings,
                stats: state.stats,
                currentEnv: state.currentEnv
            }));
            updateStats();
            updateSyncTime();
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    // UI Updates
    function updateStats() {
        const completedTasks = state.tasks.filter(t => t.completed).length;
        
        if (elements.tasksDone) {
            elements.tasksDone.textContent = completedTasks;
        }
        
        if (elements.tasksActive) {
            elements.tasksActive.textContent = state.tasks.length - completedTasks;
        }
        
        if (elements.deploymentCount) {
            elements.deploymentCount.textContent = state.stats.deployments;
        }
    }

    function updateTheme() {
        if (!elements.themeToggle) return;
        
        // Load theme from settings or default
        state.settings.theme = state.settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', state.settings.theme);
        
        // Update icon
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            icon.className = state.settings.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    function updateConnectionStatus() {
        state.isOnline = navigator.onLine;
        
        if (elements.offlineBadge) {
            if (state.isOnline) {
                elements.offlineBadge.classList.add('hidden');
            } else {
                elements.offlineBadge.classList.remove('hidden');
            }
        }
        
        if (elements.statusDot) {
            elements.statusDot.className = `status-dot ${state.isOnline ? 'online' : 'offline'}`;
        }
        
        if (elements.statusText) {
            elements.statusText.textContent = state.isOnline ? 'Online' : 'Offline';
        }
        
        if (elements.systemStatus) {
            elements.systemStatus.textContent = state.isOnline ? 'Operational' : 'Limited';
            elements.systemStatus.className = `status-text ${state.isOnline ? 'online' : 'offline'}`;
        }
        
        if (!state.isOnline) {
            showToast('Offline Mode', 'Working with cached data. Some features limited.', 'info');
        }
    }

    function updateSyncTime() {
        if (!elements.lastSync) return;
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        elements.lastSync.innerHTML = `<i class="fas fa-sync"></i> Last synced: ${timeString}`;
    }

    function updateActivityFeed() {
        if (!elements.activityFeed) return;
        
        // Generate sample activity if none exists
        if (state.activity.length === 0) {
            state.activity = generateSampleActivity();
        }
        
        elements.activityFeed.innerHTML = '';
        
        state.activity.slice(0, 10).forEach(activity => {
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

    function updateEnvBadges() {
        elements.envBadges?.forEach(badge => {
            badge.classList.toggle('active', badge.dataset.env === state.currentEnv);
        });
    }

    // Theme Management
    function toggleTheme() {
        state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
        updateTheme();
        saveState();
        showToast('Theme Changed', `Switched to ${state.settings.theme} mode`, 'info');
        logActivity(`Theme changed to ${state.settings.theme} mode`);
    }

    function toggleMobileMenu() {
        elements.sidebar?.classList.toggle('active');
        elements.mobileOverlay?.classList.toggle('active');
        document.body.style.overflow = elements.sidebar?.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileMenu() {
        elements.sidebar?.classList.remove('active');
        elements.mobileOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    function toggleSearch() {
        elements.searchBar?.classList.toggle('active');
        if (elements.searchBar?.classList.contains('active')) {
            elements.searchInput?.focus();
        }
    }

    function handleSearch() {
        renderTasks();
        if (elements.clearSearch) {
            elements.clearSearch.style.display = elements.searchInput?.value ? 'block' : 'none';
        }
    }

    function clearSearch() {
        if (elements.searchInput) {
            elements.searchInput.value = '';
            renderTasks();
            toggleSearch();
        }
    }

    // Toast System
    function showToast(title, message, type = 'info') {
        if (!elements.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
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
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        elements.toastContainer.appendChild(toast);

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
            type: type,
            message: message,
            time: 'Just now',
            timestamp: new Date().toISOString()
        };
        
        state.activity.unshift(activity);
        
        // Keep only last 50 activities
        if (state.activity.length > 50) {
            state.activity.pop();
        }
        
        updateActivityFeed();
    }

    function generateSampleActivity() {
        return [
            {
                type: 'deployment',
                message: `Production deployment v${config.APP_VERSION} completed successfully`,
                time: '2 hours ago',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'success',
                message: 'All CI/CD pipeline tests passed',
                time: '3 hours ago',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'info',
                message: 'Database maintenance completed',
                time: '5 hours ago',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'warning',
                message: 'Performance alert: High CPU usage detected',
                time: '1 day ago',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'info',
                message: 'Security patch v2.0.1 applied',
                time: '2 days ago',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    // PWA Installation
    async function installPWA() {
        if (!state.deferredPrompt) return;
        
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        
        console.log(`User response to install prompt: ${outcome}`);
        state.deferredPrompt = null;
        
        if (elements.installBtn) {
            elements.installBtn.style.display = 'none';
        }
    }

    // Utility Functions
    function showLoading() {
        state.isLoading = true;
        if (elements.loadingSpinner) {
            elements.loadingSpinner.classList.remove('hidden');
        }
    }

    function hideLoading() {
        state.isLoading = false;
        if (elements.loadingSpinner) {
            elements.loadingSpinner.classList.add('hidden');
        }
    }

    function checkForUpdates() {
        if (!state.isOnline) return;
        
        // Check if service worker is updated
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(isoString) {
        if (!isoString) return 'Just now';
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Just now';
        }
    }

    // Expose API to global scope
    window.app = {
        // Task Management
        addTask,
        toggleTask: toggleTaskCompletion,
        deleteTask,
        editTask: (id) => {
            const task = state.tasks.find(t => t.id === id);
            if (task && elements.todoInput) {
                elements.todoInput.value = task.text;
                elements.prioritySelect.value = task.priority;
                elements.todoInput.focus();
                
                // Remove the task
                state.tasks = state.tasks.filter(t => t.id !== id);
                renderTasks();
            }
        },
        
        // DevOps Operations
        deploy: simulateDeployment,
        runTests,
        backup: createBackup,
        clearTasks: clearCompletedTasks,
        
        // UI Controls
        toggleTheme,
        toggleMobileMenu,
        closeMobileMenu,
        
        // State Management
        getState: () => ({ ...state }),
        resetApp: () => {
            if (confirm('Reset all app data? This cannot be undone.')) {
                localStorage.clear();
                location.reload();
            }
        },
        
        // Debug
        showToast,
        logActivity
    };

    // Initialize the app
    initApp();

    // Log startup
    console.log(`🚀 ${config.APP_NAME} v${config.APP_VERSION} is ready!`);
});