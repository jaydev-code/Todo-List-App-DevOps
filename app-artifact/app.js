// DevOps Dashboard PWA - Main Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DevOps Dashboard PWA Initializing...');

    // Configuration
    const config = {
        APP_NAME: 'DevOps Dashboard',
        APP_VERSION: '3.0.0',
        STORAGE_KEY: 'devops-dashboard-v3',
        CACHE_NAME: 'devops-dashboard-cache-v3',
        API_BASE_URL: 'https://api.example.com',
        DEBUG: true,
        FEATURES: {
            offlineMode: true,
            pushNotifications: true,
            backgroundSync: true,
            themeSwitcher: true,
            voiceCommands: false
        }
    };

    // State Management
    const state = {
        tasks: [],
        activity: [],
        notifications: [],
        settings: {
            theme: localStorage.getItem('theme') || 'light',
            notifications: true,
            autoSync: true,
            sound: true,
            vibration: true
        },
        stats: {
            deployments: 12,
            uptime: 99.9,
            activeTasks: 0,
            completedTasks: 0,
            successRate: 98,
            avgResponse: 1.2,
            errorCount: 12,
            activeUsers: 42
        },
        currentEnv: 'prod',
        isOnline: navigator.onLine,
        isLoading: false,
        isInstalled: false,
        currentFilter: 'all',
        sortBy: 'date',
        notificationsEnabled: 'Notification' in window && Notification.permission === 'granted'
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
        notificationsBtn: document.getElementById('notifications-btn'),
        
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
        sortTasks: document.getElementById('sort-tasks'),
        taskCount: document.getElementById('task-count'),
        bulkActions: document.getElementById('bulk-actions'),
        addSampleTasks: document.getElementById('add-sample-tasks'),
        
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
        activityFilter: document.getElementById('activity-filter'),
        viewAllActivity: document.getElementById('view-all-activity'),
        
        // Performance Metrics
        successRate: document.getElementById('success-rate'),
        avgResponse: document.getElementById('avg-response'),
        errorCount: document.getElementById('error-count'),
        activeUsers: document.getElementById('active-users'),
        timeSelect: document.getElementById('time-select'),
        
        // Status & Footer
        statusIndicator: document.getElementById('status-indicator'),
        statusDot: document.querySelector('.status-dot'),
        statusText: document.querySelector('.status-text'),
        systemStatus: document.getElementById('system-status'),
        versionTag: document.getElementById('version-tag'),
        lastSync: document.getElementById('last-sync'),
        offlineBadge: document.getElementById('offline-badge'),
        
        // Welcome & Tour
        quickTour: document.getElementById('quick-tour'),
        
        // Toast & Loading
        toastContainer: document.getElementById('toast-container'),
        loadingSpinner: document.getElementById('loading-spinner'),
        
        // Notification Panel
        notificationPanel: document.getElementById('notification-panel'),
        notificationList: document.getElementById('notification-list'),
        closeNotifications: document.getElementById('close-notifications')
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
        updateSyncTime();
        updatePerformanceMetrics();
        updateNotificationBadge();
        
        // Check for updates
        checkForUpdates();
        
        // Request notification permission
        requestNotificationPermission();
        
        // Initialize charts
        initCharts();
        
        console.log('✅ DevOps Dashboard initialized successfully');
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Mobile Navigation
        elements.mobileMenuToggle?.addEventListener('click', toggleMobileMenu);
        elements.mobileOverlay?.addEventListener('click', closeMobileMenu);
        elements.sidebarClose?.addEventListener('click', closeMobileMenu);

        // Task Management
        elements.addBtn?.addEventListener('click', addTask);
        elements.todoInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        elements.sortTasks?.addEventListener('click', toggleSort);
        elements.bulkActions?.addEventListener('click', showBulkActions);
        elements.addSampleTasks?.addEventListener('click', addSampleTasks);

        // Filter Tasks
        elements.filterButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });

        // Search Functionality
        elements.searchToggle?.addEventListener('click', toggleSearch);
        elements.searchInput?.addEventListener('input', handleSearch);
        elements.clearSearch?.addEventListener('click', clearSearch);

        // Environment Selection
        elements.envBadges?.forEach(badge => {
            badge.addEventListener('click', () => {
                elements.envBadges.forEach(b => b.classList.remove('active'));
                badge.classList.add('active');
                state.currentEnv = badge.dataset.env;
                logActivity(`Switched to ${badge.querySelector('.env-name').textContent} environment`, 'info');
                showToast(`Environment Changed`, `Now viewing ${badge.querySelector('.env-name').textContent}`, 'info');
            });
        });

        // Quick Actions
        elements.quickDeploy?.addEventListener('click', simulateDeployment);
        elements.runTests?.addEventListener('click', runTests);
        elements.backupNow?.addEventListener('click', createBackup);
        elements.clearCompleted?.addEventListener('click', clearCompletedTasks);

        // Theme Toggle
        elements.themeToggle?.addEventListener('click', toggleTheme);

        // Activity & Performance
        elements.refreshActivity?.addEventListener('click', updateActivityFeed);
        elements.activityFilter?.addEventListener('click', filterActivity);
        elements.viewAllActivity?.addEventListener('click', viewAllActivity);
        elements.timeSelect?.addEventListener('change', updatePerformanceMetrics);

        // Notifications
        elements.notificationsBtn?.addEventListener('click', toggleNotifications);
        elements.closeNotifications?.addEventListener('click', closeNotificationsPanel);

        // Tour
        elements.quickTour?.addEventListener('click', startQuickTour);

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
                elements.installBtn.style.display = 'flex';
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

        // Resize handling for responsive design
        window.addEventListener('resize', handleResize);
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // Task Management Functions
    function addTask() {
        const text = elements.todoInput?.value.trim();
        const priority = elements.prioritySelect?.value || 'normal';
        const deadline = elements.deadlineInput?.value || '';
        
        if (!text) {
            showToast('Empty Task', 'Please enter a task description.', 'error');
            elements.todoInput?.focus();
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
            assignedTo: 'devops-team',
            tags: getTaskTags(text)
        };

        state.tasks.unshift(task);
        saveState();
        renderTasks();
        
        if (elements.todoInput) {
            elements.todoInput.value = '';
            elements.todoInput.focus();
        }
        
        showToast('Task Added', 'New DevOps task has been added.', 'success');
        logActivity(`Task added: "${text}" (${priority} priority)`, 'info');
        
        // Send notification if enabled
        if (state.notificationsEnabled) {
            sendNotification('New Task Added', `"${text}" has been added to your DevOps tasks.`);
        }
    }

    function getTaskTags(text) {
        const tags = [];
        if (text.toLowerCase().includes('deploy')) tags.push('deployment');
        if (text.toLowerCase().includes('test')) tags.push('testing');
        if (text.toLowerCase().includes('fix') || text.toLowerCase().includes('bug')) tags.push('bugfix');
        if (text.toLowerCase().includes('monitor') || text.toLowerCase().includes('alert')) tags.push('monitoring');
        return tags;
    }

    function toggleTaskCompletion(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveState();
            renderTasks();
            
            const message = task.completed ? 'Task completed successfully' : 'Task reopened for work';
            const title = task.completed ? 'Task Completed' : 'Task Reopened';
            
            showToast(title, message, 'success');
            logActivity(`Task ${task.completed ? 'completed' : 'reopened'}: "${task.text}"`, 'info');
            
            // Update stats
            updateStats();
        }
    }

    function deleteTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveState();
            renderTasks();
            showToast('Task Deleted', 'Task has been removed from the system.', 'success');
            logActivity(`Task deleted: "${task.text}"`, 'warning');
        }
    }

    function editTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task && elements.todoInput) {
            elements.todoInput.value = task.text;
            elements.prioritySelect.value = task.priority;
            elements.deadlineInput.value = task.deadline || '';
            elements.todoInput.focus();
            
            // Remove the task
            state.tasks = state.tasks.filter(t => t.id !== id);
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
        const searchTerm = elements.searchInput?.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(searchTerm) ||
                task.priority.toLowerCase().includes(searchTerm) ||
                (task.tags && task.tags.some(tag => tag.includes(searchTerm)))
            );
        }

        // Sort tasks
        filteredTasks.sort((a, b) => {
            if (state.sortBy === 'priority') {
                const priorityOrder = { critical: 0, high: 1, normal: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        elements.todoList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            elements.emptyState.style.display = 'flex';
            elements.taskCount.textContent = '0 tasks';
            return;
        }
        
        elements.emptyState.style.display = 'none';
        elements.taskCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.id = task.id;
            li.dataset.priority = task.priority;
            
            const deadlineText = task.deadline ? formatDate(task.deadline, true) : 'No deadline';
            const tagsHTML = task.tags?.map(tag => `<span class="task-tag">${tag}</span>`).join('') || '';
            
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <div class="task-tags">${tagsHTML}</div>
                        <div class="task-details">
                            <span class="task-priority ${task.priority}">
                                <i class="fas fa-${getPriorityIcon(task.priority)}"></i>
                                ${task.priority.toUpperCase()}
                            </span>
                            <span class="task-date">
                                <i class="fas fa-calendar"></i>
                                ${formatDate(task.createdAt)}
                            </span>
                            <span class="task-deadline ${isOverdue(task.deadline) ? 'overdue' : ''}">
                                <i class="fas fa-clock"></i>
                                ${deadlineText}
                            </span>
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
            li.addEventListener('touchstart', () => {
                li.classList.add('touched');
            });
            
            li.addEventListener('touchend', () => {
                setTimeout(() => li.classList.remove('touched'), 150);
            });
            
            elements.todoList.appendChild(li);
        });
    }

    // DevOps Operations
    function simulateDeployment() {
        showLoading('Starting deployment...');
        logActivity(`Starting deployment to ${state.currentEnv} environment`, 'deployment');
        
        setTimeout(() => {
            hideLoading();
            state.stats.deployments++;
            updateStats();
            showToast('Deployment Started', `Deploying to ${state.currentEnv}...`, 'info');
            
            // Simulate deployment steps
            const steps = ['Building', 'Testing', 'Deploying', 'Verifying'];
            let currentStep = 0;
            
            const interval = setInterval(() => {
                if (currentStep < steps.length) {
                    showToast('Deployment Progress', `${steps[currentStep]}...`, 'info');
                    currentStep++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        showToast('Deployment Complete', `Successfully deployed to ${state.currentEnv}!`, 'success');
                        logActivity(`Deployment to ${state.currentEnv} completed successfully`, 'success');
                        updateActivityFeed();
                        
                        // Update performance metrics
                        state.stats.successRate = Math.min(100, state.stats.successRate + 0.5);
                        updatePerformanceMetrics();
                    }, 1000);
                }
            }, 1500);
        }, 1000);
    }

    function runTests() {
        showLoading('Running test suite...');
        logActivity('Running test suite', 'info');
        
        setTimeout(() => {
            hideLoading();
            const passed = Math.random() > 0.2; // 80% success rate
            
            if (passed) {
                showToast('Tests Passed', 'All tests completed successfully!', 'success');
                logActivity('Test suite passed all checks', 'success');
                state.stats.successRate = Math.min(100, state.stats.successRate + 1);
            } else {
                showToast('Tests Failed', 'Some tests failed. Check logs.', 'error');
                logActivity('Test suite failed with errors', 'error');
                state.stats.errorCount++;
            }
            
            updatePerformanceMetrics();
        }, 3000);
    }

    function createBackup() {
        showLoading('Creating system backup...');
        logActivity('Creating system backup', 'info');
        
        setTimeout(() => {
            hideLoading();
            showToast('Backup Created', 'System backup completed successfully.', 'success');
            logActivity('System backup created and verified', 'success');
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
            logActivity(`Cleared ${completedCount} completed tasks`, 'info');
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
        }
    }

    function saveState() {
        try {
            localStorage.setItem(config.STORAGE_KEY, JSON.stringify({
                tasks: state.tasks,
                settings: state.settings,
                stats: state.stats,
                currentEnv: state.currentEnv,
                lastUpdated: new Date().toISOString()
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
        const activeTasks = state.tasks.length - completedTasks;
        
        if (elements.tasksDone) {
            elements.tasksDone.textContent = completedTasks;
        }
        
        if (elements.tasksActive) {
            elements.tasksActive.textContent = activeTasks;
        }
        
        if (elements.deploymentCount) {
            elements.deploymentCount.textContent = state.stats.deployments;
        }
    }

    function updatePerformanceMetrics() {
        if (elements.successRate) {
            elements.successRate.textContent = `${state.stats.successRate}%`;
        }
        
        if (elements.avgResponse) {
            elements.avgResponse.textContent = `${state.stats.avgResponse}s`;
        }
        
        if (elements.errorCount) {
            elements.errorCount.textContent = state.stats.errorCount;
        }
        
        if (elements.activeUsers) {
            elements.activeUsers.textContent = state.stats.activeUsers;
        }
    }

    function updateTheme() {
        if (!elements.themeToggle) return;
        
        document.documentElement.setAttribute('data-theme', state.settings.theme);
        
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            icon.className = state.settings.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        localStorage.setItem('theme', state.settings.theme);
    }

    function updateConnectionStatus() {
        state.isOnline = navigator.onLine;
        
        if (elements.offlineBadge) {
            elements.offlineBadge.classList.toggle('hidden', state.isOnline);
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

    function updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        const notificationCount = state.notifications.length;
        
        if (badge) {
            if (notificationCount > 0) {
                badge.textContent = notificationCount > 9 ? '9+' : notificationCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    // Theme Management
    function toggleTheme() {
        state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
        updateTheme();
        saveState();
        showToast('Theme Changed', `Switched to ${state.settings.theme} mode`, 'info');
        logActivity(`Theme changed to ${state.settings.theme} mode`, 'info');
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
            setTimeout(() => elements.searchInput?.focus(), 100);
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
            elements.clearSearch.style.display = 'none';
        }
    }

    function toggleSort() {
        state.sortBy = state.sortBy === 'date' ? 'priority' : 'date';
        const icon = elements.sortTasks.querySelector('i');
        icon.className = state.sortBy === 'date' ? 'fas fa-sort-amount-down' : 'fas fa-exclamation-triangle';
        renderTasks();
        showToast('Sort Changed', `Sorting by ${state.sortBy}`, 'info');
    }

    function toggleNotifications() {
        elements.notificationPanel?.classList.toggle('hidden');
        if (!elements.notificationPanel?.classList.contains('hidden')) {
            loadNotifications();
        }
    }

    function closeNotificationsPanel() {
        elements.notificationPanel?.classList.add('hidden');
    }

    function loadNotifications() {
        if (!elements.notificationList) return;
        
        elements.notificationList.innerHTML = '';
        
        if (state.notifications.length === 0) {
            elements.notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }
        
        state.notifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            
            notificationItem.innerHTML = `
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${escapeHtml(notification.title)}</h4>
                    <p>${escapeHtml(notification.message)}</p>
                    <span class="notification-time">${formatDate(notification.timestamp)}</span>
                </div>
                <button class="notification-dismiss" data-id="${notification.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            elements.notificationList.appendChild(notificationItem);
        });
        
        // Add dismiss event listeners
        document.querySelectorAll('.notification-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                dismissNotification(id);
            });
        });
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
        
        state.activity.unshift(activity);
        
        // Keep only last 50 activities
        if (state.activity.length > 50) {
            state.activity.pop();
        }
        
        updateActivityFeed();
        
        // Add notification for important activities
        if (type === 'error' || type === 'deployment') {
            addNotification({
                title: type === 'deployment' ? 'Deployment Started' : 'Error Detected',
                message: message,
                type: type,
                timestamp: new Date().toISOString()
            });
        }
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
            },
            {
                id: '4',
                type: 'warning',
                message: 'Performance alert: High CPU usage detected',
                time: '1 day ago',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '5',
                type: 'info',
                message: 'Security patch v2.0.1 applied',
                time: '2 days ago',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    // Notification System
    function addNotification(notification) {
        notification.id = Date.now() + Math.random().toString(36).substr(2, 9);
        notification.read = false;
        
        state.notifications.unshift(notification);
        
        // Keep only last 20 notifications
        if (state.notifications.length > 20) {
            state.notifications.pop();
        }
        
        updateNotificationBadge();
        
        // Show system notification if enabled
        if (state.notificationsEnabled && state.settings.notifications) {
            sendNotification(notification.title, notification.message);
        }
    }

    function dismissNotification(id) {
        state.notifications = state.notifications.filter(n => n.id !== id);
        loadNotifications();
        updateNotificationBadge();
    }

    function requestNotificationPermission() {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                state.notificationsEnabled = permission === 'granted';
            });
        }
    }

    function sendNotification(title, body) {
        if (!state.notificationsEnabled || !state.settings.notifications) return;
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: './icons/icon-192x192.png',
                badge: './icons/badge-96x96.png',
                tag: 'devops-dashboard'
            });
        }
    }

    function getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            deployment: 'rocket'
        };
        return icons[type] || 'info-circle';
    }

    // Tour System
    function startQuickTour() {
        showToast('Quick Tour', 'Starting interactive tour of the dashboard...', 'info');
        
        const steps = [
            {
                element: '.task-card',
                title: 'Task Management',
                content: 'Add, edit, and manage your DevOps tasks here. Filter by status and priority.'
            },
            {
                element: '.env-badges',
                title: 'Environments',
                content: 'Switch between different deployment environments (Prod, Staging, Dev).'
            },
            {
                element: '.quick-actions-grid',
                title: 'Quick Actions',
                content: 'Perform common DevOps operations with a single click.'
            },
            {
                element: '.activity-card',
                title: 'Activity Feed',
                content: 'Monitor recent activities and system events.'
            }
        ];
        
        let currentStep = 0;
        
        function showStep() {
            if (currentStep >= steps.length) {
                showToast('Tour Complete', 'You\'re ready to use the dashboard!', 'success');
                return;
            }
            
            const step = steps[currentStep];
            showToast(step.title, step.content, 'info');
            currentStep++;
            
            // Highlight the element
            const element = document.querySelector(step.element);
            if (element) {
                element.classList.add('tour-highlight');
                setTimeout(() => element.classList.remove('tour-highlight'), 3000);
            }
            
            setTimeout(showStep, 3000);
        }
        
        showStep();
    }

    // Sample Data
    function addSampleTasks() {
        const sampleTasks = [
            {
                text: 'Deploy version 3.0.0 to production',
                priority: 'critical',
                env: 'prod',
                deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0]
            },
            {
                text: 'Fix authentication bug in API gateway',
                priority: 'high',
                env: 'dev',
                deadline: new Date(Date.now() + 172800000).toISOString().split('T')[0]
            },
            {
                text: 'Update monitoring dashboard with new metrics',
                priority: 'normal',
                env: 'staging',
                deadline: new Date(Date.now() + 259200000).toISOString().split('T')[0]
            },
            {
                text: 'Run security scan on staging environment',
                priority: 'high',
                env: 'staging',
                deadline: new Date(Date.now() + 432000000).toISOString().split('T')[0]
            },
            {
                text: 'Optimize database queries for better performance',
                priority: 'normal',
                env: 'dev',
                deadline: new Date(Date.now() + 604800000).toISOString().split('T')[0]
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
                env: taskData.env,
                assignedTo: 'devops-team',
                tags: getTaskTags(taskData.text)
            };
            
            state.tasks.push(task);
        });
        
        saveState();
        renderTasks();
        showToast('Sample Tasks Added', '5 sample DevOps tasks have been added.', 'success');
    }

    // Bulk Actions
    function showBulkActions() {
        const actions = [
            { label: 'Mark Selected as Done', action: 'complete' },
            { label: 'Delete Selected', action: 'delete' },
            { label: 'Move to Staging', action: 'move-staging' },
            { label: 'Set Priority: High', action: 'set-high' }
        ];
        
        const modal = document.createElement('div');
        modal.className = 'bulk-actions-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Bulk Actions</h3>
                <div class="modal-actions">
                    ${actions.map(action => `
                        <button class="modal-action-btn" data-action="${action.action}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
                <button class="modal-close">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelectorAll('.modal-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                handleBulkAction(action);
                modal.remove();
            });
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    function handleBulkAction(action) {
        // In a real app, you'd have selection functionality
        showToast('Bulk Action', `${action} action would be performed on selected tasks.`, 'info');
    }

    // Charts
    function initCharts() {
        const canvas = document.getElementById('performance-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Simple chart implementation
        const data = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Deployments',
                data: [5, 8, 12, 9, 15, 7, 10],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Errors',
                data: [2, 4, 1, 3, 5, 2, 1],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
        
        // Draw simple chart
        setTimeout(() => {
            drawSimpleChart(ctx, data);
        }, 100);
    }

    function drawSimpleChart(ctx, data) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw data
        const maxValue = Math.max(...data.datasets[0].data, ...data.datasets[1].data);
        const xStep = width / (data.labels.length - 1);
        const yScale = height / maxValue;
        
        // Draw deployment line
        ctx.beginPath();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        
        data.datasets[0].data.forEach((value, i) => {
            const x = i * xStep;
            const y = height - (value * yScale);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw error line
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        
        data.datasets[1].data.forEach((value, i) => {
            const x = i * xStep;
            const y = height - (value * yScale);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    // Responsive Design
    function handleResize() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            elements.mobileMenuToggle.style.display = 'flex';
            elements.sidebar.classList.remove('active');
        } else {
            elements.mobileMenuToggle.style.display = 'none';
            elements.sidebar.classList.add('active');
            closeMobileMenu();
        }
        
        // Update chart on resize
        initCharts();
    }

    // Keyboard Shortcuts
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: New task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            elements.todoInput?.focus();
        }
        
        // Ctrl/Cmd + K: Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleSearch();
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeNotificationsPanel();
        }
    }

    // Utility Functions
    function showLoading(message = 'Loading...') {
        state.isLoading = true;
        if (elements.loadingSpinner) {
            elements.loadingSpinner.classList.remove('hidden');
            const loadingText = elements.loadingSpinner.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
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

    function formatDate(isoString, input = false) {
        if (!isoString) return 'No date';
        
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diff = now - date;
            
            if (input) {
                return date.toLocaleDateString();
            }
            
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Invalid date';
        }
    }

    function isOverdue(deadline) {
        if (!deadline) return false;
        try {
            return new Date(deadline) < new Date();
        } catch (e) {
            return false;
        }
    }

    // Helper functions for activity
    function filterActivity() {
        showToast('Filter', 'Activity filter dialog would open here.', 'info');
    }

    function viewAllActivity() {
        showToast('View All', 'All activity view would open here.', 'info');
    }

    // Expose API to global scope
    window.app = {
        // Task Management
        addTask,
        toggleTask: toggleTaskCompletion,
        deleteTask,
        editTask,
        
        // DevOps Operations
        deploy: simulateDeployment,
        runTests,
        backup: createBackup,
        clearTasks: clearCompletedTasks,
        
        // UI Controls
        toggleTheme,
        toggleMobileMenu,
        closeMobileMenu,
        toggleNotifications,
        
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
        logActivity,
        addSampleTasks
    };

    // Initialize the app
    initApp();
    handleResize(); // Initial responsive check

    // Log startup
    console.log(`🚀 ${config.APP_NAME} v${config.APP_VERSION} is ready!`);
});