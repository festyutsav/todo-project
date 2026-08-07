// =======================================
// Select Elements
// =======================================

const STORAGE_KEY = 'todoAppTasks';
const PRIORITIES = ['High', 'Medium', 'Low'];
const PRIORITY_DETAILS = {
    High: { rank: 0 },
    Medium: { rank: 1 },
    Low: { rank: 2 },
};
const taskInput = document.querySelector('#taskInput');
const taskPriority = document.querySelector('#taskPriority');
const taskList = document.querySelector('#taskList');
const taskMeta = document.querySelector('#taskMeta');
const taskForm = document.querySelector('#taskForm');
const taskSearch = document.querySelector('#taskSearch');
const filterButtons = document.querySelectorAll('.filter-btn');
const emptyState = document.querySelector('#emptyState');
const initialEmptyState = document.querySelector('#initialEmptyState');
const clearSearchButton = document.querySelector('#clearSearch');
const taskResults = document.querySelector('#taskResults');
const sortPriorityButton = document.querySelector('#sortPriority');
const celebrationMessage = document.querySelector('#celebrationMessage');
const toastRegion = document.querySelector('#toastRegion');
const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
let activeEditTask = null;
let activeFilter = 'all';
let celebrationTimeline = null;
let taskMetaTimeline = null;
let taskMetaTimeout = null;
let successAudioContext = null;
let hasCelebratedCurrentCycle = false;
const toastQueue = [];
let activeToast = null;

// =======================================
// Events
// =======================================

taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTask();
});

taskInput.addEventListener('input', () => {
    taskInput.classList.remove('input-error');
});

// Search and filters are display-only controls; no search state is persisted.
taskSearch.addEventListener('input', () => {
    updateClearSearchButton();
    applyTaskFilters();
});

taskSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && taskSearch.value) {
        event.preventDefault();
        clearTaskSearch();
    }
});

clearSearchButton.addEventListener('click', () => {
    clearTaskSearch();
    taskSearch.focus();
});

sortPriorityButton.addEventListener('click', () => {
    sortTasksByPriority();
});

filterButtons.forEach((filterButton) => {
    filterButton.addEventListener('click', () => {
        activeFilter = filterButton.dataset.filter;

        filterButtons.forEach((button) => {
            const isActive = button === filterButton;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive);
        });

        if (motionAllowed && gsap) {
            gsap.fromTo(filterButton,
                { scale: 0.94 },
                { scale: 1, duration: 0.24, ease: 'back.out(2)' },
            );
        }

        applyTaskFilters();
    });
});

// =======================================
// Local Storage
// =======================================

function getStoredTasks() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveTasks() {
    // The data attribute remains available while the visible text is replaced by an edit input.
    const tasks = Array.from(taskList.children).map((taskItem) => ({
        text: taskItem.dataset.taskText,
        completed: taskItem.classList.contains('completed'),
        priority: taskItem.dataset.taskPriority,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = getStoredTasks();
    tasks.forEach((task) => createTaskItem(task, false));
    // Persist the default priority for tasks saved before priority support was introduced.
    saveTasks();
    updateTaskMeta();
    updateClearSearchButton();
    applyTaskFilters(false);
}

// =======================================
// Create Task
// =======================================

function createTaskItem(task, shouldAnimate = true) {
    const taskItem = document.createElement('li');
    const priority = getTaskPriority(task.priority);
    taskItem.className = 'task-item';
    taskItem.dataset.taskText = task.text;
    taskItem.dataset.taskPriority = priority;
    taskItem.classList.add(`priority-${priority.toLowerCase()}`);
    if (task.completed) {
        taskItem.classList.add('completed');
    }

    const taskContent = document.createElement('span');
    taskContent.classList.add('task-content');
    taskContent.textContent = task.text;

    const taskActions = document.createElement('div');
    taskActions.classList.add('task-actions');

    renderTaskActions(taskItem, taskActions);
    taskItem.append(taskContent, taskActions);
    taskList.append(taskItem);

    if (shouldAnimate && motionAllowed && gsap) {
        gsap.from(taskItem, {
            opacity: 0,
            y: 18,
            scale: 0.97,
            duration: 0.48,
            ease: 'back.out(1.45)',
        });
    }

    taskItem.addEventListener('click', () => {
        if (activeEditTask === taskItem) {
            return;
        }

        const wereAllTasksCompleted = areAllTasksCompleted();
        taskItem.classList.toggle('completed');
        saveTasks();
        applyTaskFilters();
        const hasCompletedAllTasks = checkForAllTasksCompleted(wereAllTasksCompleted);

    if (hasCompletedAllTasks) {
        celebrateAllTasksCompleted(taskItem);
        } else if (motionAllowed && gsap) {
            gsap.fromTo(taskItem,
                { scale: 0.985 },
                { scale: 1, duration: 0.42, ease: 'elastic.out(1, 0.45)' },
            );
        }
    });

}

// =======================================
// Completion Celebration
// =======================================

function areAllTasksCompleted() {
    const taskItems = Array.from(taskList.children);
    return taskItems.length > 0 && taskItems.every((taskItem) => taskItem.classList.contains('completed'));
}

function checkForAllTasksCompleted(wereAllTasksCompleted) {
    // This function is called only after a completion toggle, preventing load/filter/edit celebrations.
    const hasCompletedAllTasks = !wereAllTasksCompleted && areAllTasksCompleted();

    if (!areAllTasksCompleted()) {
        hasCelebratedCurrentCycle = false;
    }

    return hasCompletedAllTasks && !hasCelebratedCurrentCycle;
}

function celebrateAllTasksCompleted(taskItem) {
    hasCelebratedCurrentCycle = true;
    playSuccessSound();
    showMissionComplete();
    showToast('All tasks completed', '🎉');

    const launchCelebration = () => {
        if (motionAllowed && window.confetti) {
            launchCompletionConfetti();
            window.setTimeout(showCelebrationMessage, 620);
            return;
        }

        showCelebrationMessage();
    };

    // The final card receives a short reward pulse before the page-level celebration begins.
    if (motionAllowed && gsap) {
        gsap.timeline()
            .to(taskItem, { scale: 1.035, duration: 0.2, ease: 'power2.out' })
            .to(taskItem, { scale: 1, duration: 0.28, ease: 'back.out(1.5)' })
            .add(launchCelebration);
        return;
    }

    launchCelebration();
}

function playSuccessSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
        return;
    }

    try {
        successAudioContext ??= new AudioContext();
        const oscillator = successAudioContext.createOscillator();
        const gain = successAudioContext.createGain();
        const startTime = successAudioContext.currentTime;

        // This is created from the completion click, satisfying modern browser autoplay policies.
        successAudioContext.resume();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(659.25, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, startTime + 0.13);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.035, startTime + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);

        oscillator.connect(gain);
        gain.connect(successAudioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.21);
    } catch (error) {
        // Audio is optional: browsers that block it still receive the visual celebration.
    }
}

function showMissionComplete() {
    window.clearTimeout(taskMetaTimeout);
    taskMetaTimeline?.kill();
    taskMeta.textContent = 'Mission Complete! 🎉';

    if (!motionAllowed || !gsap) {
        taskMetaTimeout = window.setTimeout(updateTaskMeta, 2000);
        return;
    }

    taskMetaTimeline = gsap.timeline({
        onComplete: () => {
            taskMetaTimeline = null;
            updateTaskMeta();
        },
    });

    taskMetaTimeline
        .fromTo(taskMeta,
            { opacity: 0.4, y: 5 },
            { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
        )
        .to(taskMeta, { opacity: 1, duration: 0.01, delay: 1.72 });
}

function resetCompletionCycle() {
    hasCelebratedCurrentCycle = false;
}

function launchCompletionConfetti() {
    const colors = ['#8b5cf6', '#38bdf8', '#f8fafc', '#f9a8d4'];
    const launchBurst = (angle, origin) => {
        window.confetti({
            particleCount: 52,
            angle,
            spread: 58,
            startVelocity: 38,
            ticks: 90,
            scalar: 0.9,
            origin,
            colors,
            disableForReducedMotion: true,
        });
    };

    launchBurst(58, { x: 0.12, y: 0.76 });
    window.setTimeout(() => launchBurst(122, { x: 0.88, y: 0.76 }), 150);
    window.setTimeout(() => launchBurst(90, { x: 0.5, y: 0.62 }), 300);
}

function showCelebrationMessage() {
    celebrationTimeline?.kill();
    celebrationMessage.classList.add('is-visible');

    if (!motionAllowed || !gsap) {
        window.setTimeout(() => celebrationMessage.classList.remove('is-visible'), 3200);
        return;
    }

    celebrationTimeline = gsap.timeline({
        onComplete: () => celebrationMessage.classList.remove('is-visible'),
    });

    celebrationTimeline
        .set(celebrationMessage, { opacity: 0, y: 14, scale: 0.96 })
        .to(celebrationMessage, { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.5)' })
        .to(celebrationMessage, { opacity: 0, y: -10, duration: 0.32, ease: 'power2.in', delay: 2.6 });
}

function getTaskPriority(priority) {
    // Older saved tasks did not have a priority, so they retain the new Medium default on load.
    return PRIORITIES.includes(priority) ? priority : 'Medium';
}

function renderTaskActions(taskItem, taskActions) {
    const priorityBadge = createPriorityBadge(taskItem);
    const editButton = createTaskButton('✏️', 'edit-btn', `Edit task: ${taskItem.dataset.taskText}`);
    const deleteButton = createTaskButton('&times;', 'delete-btn', `Delete task: ${taskItem.dataset.taskText}`);

    taskActions.replaceChildren(priorityBadge, editButton, deleteButton);

    priorityBadge.addEventListener('click', (event) => {
        event.stopPropagation();
        cycleTaskPriority(taskItem);
    });

    editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        startTaskEdit(taskItem);
    });

    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteTask(taskItem);
    });
}

function createPriorityBadge(taskItem) {
    const priority = taskItem.dataset.taskPriority;
    const priorityBadge = createTaskButton(
        `<span class="priority-dot" aria-hidden="true"></span><span class="priority-badge__label">${priority}</span>`,
        `priority-badge priority-${priority.toLowerCase()}`,
        `Priority: ${priority}. Activate to change priority`,
    );
    priorityBadge.dataset.tooltip = `Priority: ${priority}. Click to change.`;

    return priorityBadge;
}

function cycleTaskPriority(taskItem) {
    const currentPriorityIndex = PRIORITIES.indexOf(taskItem.dataset.taskPriority);
    const nextPriority = PRIORITIES[(currentPriorityIndex + 1) % PRIORITIES.length];

    updateTaskPriority(taskItem, nextPriority);
}

function updateTaskPriority(taskItem, priority) {
    const nextPriority = getTaskPriority(priority);
    const priorityBadge = taskItem.querySelector('.priority-badge');

    taskItem.dataset.taskPriority = nextPriority;
    PRIORITIES.forEach((priorityName) => {
        taskItem.classList.toggle(`priority-${priorityName.toLowerCase()}`, priorityName === nextPriority);
    });

    if (priorityBadge) {
        priorityBadge.className = `priority-badge priority-${nextPriority.toLowerCase()}`;
        priorityBadge.innerHTML = `<span class="priority-dot" aria-hidden="true"></span><span class="priority-badge__label">${nextPriority}</span>`;
        priorityBadge.setAttribute('aria-label', `Priority: ${nextPriority}. Activate to change priority`);
        priorityBadge.dataset.tooltip = `Priority: ${nextPriority}. Click to change.`;

        if (motionAllowed && gsap) {
            gsap.fromTo(priorityBadge,
                { opacity: 0.55, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.26, ease: 'back.out(1.6)' },
            );
        }
    }

    saveTasks();
}

// =======================================
// Edit Task
// =======================================

function createTaskButton(label, className, ariaLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = label;
    button.classList.add(...className.split(' '));
    button.setAttribute('aria-label', ariaLabel);
    return button;
}

function startTaskEdit(taskItem) {
    // Finish the previous edit before opening another so only one inline form exists.
    if (activeEditTask && activeEditTask !== taskItem) {
        cancelTaskEdit(activeEditTask, false);
    }

    if (activeEditTask === taskItem) {
        return;
    }

    const taskContent = taskItem.querySelector('.task-content');
    const taskActions = taskItem.querySelector('.task-actions');
    const originalText = taskItem.dataset.taskText;
    const editInput = document.createElement('input');
    const saveButton = createTaskButton('✔', 'save-btn', 'Save task changes');
    const cancelButton = createTaskButton('✖', 'cancel-btn', 'Cancel task changes');

    editInput.type = 'text';
    editInput.value = originalText;
    editInput.classList.add('edit-input');
    editInput.setAttribute('aria-label', 'Edit task text');
    editInput.autocomplete = 'off';

    taskItem.classList.add('editing');
    taskContent.replaceWith(editInput);
    taskActions.replaceChildren(saveButton, cancelButton);
    activeEditTask = taskItem;

    editInput.focus();
    editInput.select();

    // Keep the edit transition restrained so it complements the existing card motion.
    if (motionAllowed && gsap) {
        gsap.fromTo([editInput, taskActions],
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.24, stagger: 0.04, ease: 'power2.out' },
        );
    }

    saveButton.addEventListener('click', (event) => {
        event.stopPropagation();
        saveTaskEdit(taskItem);
    });

    cancelButton.addEventListener('click', (event) => {
        event.stopPropagation();
        cancelTaskEdit(taskItem);
    });

    editInput.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    editInput.addEventListener('input', () => {
        editInput.classList.remove('input-error');
    });

    editInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveTaskEdit(taskItem);
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            cancelTaskEdit(taskItem);
        }
    });
}

function saveTaskEdit(taskItem) {
    const editInput = taskItem.querySelector('.edit-input');
    const updatedText = editInput.value.trim();

    // Empty edits remain open and visibly invalid instead of overwriting a task with blank text.
    if (!updatedText) {
        editInput.classList.add('input-error');
        editInput.focus();

        if (motionAllowed && gsap) {
            gsap.fromTo(editInput,
                { x: -5 },
                { x: 0, duration: 0.28, ease: 'elastic.out(1, 0.4)' },
            );
        }
        return;
    }

    taskItem.dataset.taskText = updatedText;
    finishTaskEdit(taskItem, updatedText);
    saveTasks();
    applyTaskFilters();
    showToast('Task updated', '✏️');
}

function cancelTaskEdit(taskItem, shouldAnimate = true) {
    // The stored value is the original text until a valid save is completed.
    finishTaskEdit(taskItem, taskItem.dataset.taskText, shouldAnimate);
}

function finishTaskEdit(taskItem, taskText, shouldAnimate = true) {
    const editInput = taskItem.querySelector('.edit-input');
    const taskActions = taskItem.querySelector('.task-actions');
    const taskContent = document.createElement('span');

    taskContent.classList.add('task-content');
    taskContent.textContent = taskText;
    taskItem.classList.remove('editing');
    editInput.replaceWith(taskContent);
    renderTaskActions(taskItem, taskActions);
    activeEditTask = null;

    if (shouldAnimate && motionAllowed && gsap) {
        gsap.fromTo([taskContent, taskActions],
            { opacity: 0, y: -5 },
            { opacity: 1, y: 0, duration: 0.22, stagger: 0.035, ease: 'power2.out' },
        );
    }
}

function deleteTask(taskItem) {
    // Deleting an active item also clears the single-editor reference.
    if (activeEditTask === taskItem) {
        activeEditTask = null;
    }

    const removeTask = () => {
        taskItem.remove();
        updateTaskMeta();
        saveTasks();
        applyTaskFilters();
        showToast('Task deleted', '🗑');
    };

    if (motionAllowed && gsap) {
        const taskHeight = taskItem.offsetHeight;

        gsap.timeline()
            .set(taskItem, { height: taskHeight, overflow: 'hidden' })
            .to(taskItem, {
                opacity: 0,
                x: 20,
                rotation: 1,
                scale: 0.97,
                duration: 0.18,
                ease: 'power2.in',
            })
            .to(taskItem, {
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: -8,
                marginBottom: -8,
                borderWidth: 0,
                duration: 0.22,
                ease: 'power2.inOut',
                onComplete: removeTask,
            });
    } else {
        removeTask();
    }
}

// =======================================
// Add Task
// =======================================

function addTask() {
    const taskText = taskInput.value.trim();

    if (!taskText) {
        taskInput.classList.add('input-error');
        taskInput.focus();
        if (motionAllowed && gsap) {
            gsap.fromTo(taskInput,
                { x: -7 },
                { x: 0, duration: 0.36, ease: 'elastic.out(1, 0.35)' },
            );
        }
        return;
    }

    createTaskItem({ text: taskText, completed: false, priority: taskPriority.value });
    resetCompletionCycle();
    taskInput.value = '';
    taskPriority.value = 'Medium';
    taskInput.focus();
    updateTaskMeta();
    saveTasks();
    applyTaskFilters();
    showToast('Task added', '✓');
}

// =======================================
// Sort Tasks
// =======================================

function sortTasksByPriority() {
    const taskItems = Array.from(taskList.children);
    const originalPositions = new Map(
        taskItems.map((taskItem) => [taskItem, taskItem.getBoundingClientRect().top]),
    );
    const sortedTaskItems = taskItems.sort((firstTask, secondTask) => {
        const firstRank = PRIORITY_DETAILS[firstTask.dataset.taskPriority].rank;
        const secondRank = PRIORITY_DETAILS[secondTask.dataset.taskPriority].rank;
        return firstRank - secondRank;
    });

    // Appending existing nodes preserves every task's listeners, completion state, and edit state.
    taskList.append(...sortedTaskItems);
    saveTasks();

    if (motionAllowed && gsap) {
        sortedTaskItems.forEach((taskItem) => {
            const previousTop = originalPositions.get(taskItem);
            const positionDifference = previousTop - taskItem.getBoundingClientRect().top;

            if (positionDifference) {
                gsap.fromTo(taskItem,
                    { y: positionDifference },
                    { y: 0, duration: 0.34, ease: 'power2.out' },
                );
            }
        });
    }
}

// =======================================
// Search And Filters
// =======================================

function applyTaskFilters(shouldAnimate = true) {
    const searchQuery = taskSearch.value.trim().toLowerCase();
    let matchingTaskCount = 0;

    Array.from(taskList.children).forEach((taskItem) => {
        const taskText = taskItem.dataset.taskText.toLowerCase();
        const isCompleted = taskItem.classList.contains('completed');
        const matchesSearch = taskText.includes(searchQuery);
        const matchesFilter =
            activeFilter === 'all' ||
            (activeFilter === 'pending' && !isCompleted) ||
            (activeFilter === 'completed' && isCompleted);
        const shouldShow = matchesSearch && matchesFilter;

        if (shouldShow) {
            matchingTaskCount += 1;
        }

        setTaskVisibility(taskItem, shouldShow, shouldAnimate);
    });

    setEmptyStateVisibility(matchingTaskCount === 0, shouldAnimate);
    setInitialEmptyStateVisibility(taskList.children.length === 0, shouldAnimate);
    updateTaskResults(matchingTaskCount, taskList.children.length);
}

function setInitialEmptyStateVisibility(shouldShow, shouldAnimate) {
    const isVisible = initialEmptyState.classList.contains('is-visible');

    if (shouldShow === isVisible) {
        return;
    }

    initialEmptyState.classList.toggle('is-visible', shouldShow);

    if (shouldShow && shouldAnimate && motionAllowed && gsap) {
        gsap.fromTo(initialEmptyState,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
        );
    }
}

function clearTaskSearch() {
    taskSearch.value = '';
    updateClearSearchButton();
    applyTaskFilters();
}

function updateClearSearchButton() {
    const shouldShow = taskSearch.value.length > 0;
    clearSearchButton.classList.toggle('is-visible', shouldShow);
    clearSearchButton.tabIndex = shouldShow ? 0 : -1;
}

function updateTaskResults(visibleTaskCount, totalTaskCount) {
    taskResults.textContent = `Showing ${visibleTaskCount} of ${totalTaskCount} task${totalTaskCount === 1 ? '' : 's'}`;
}

function setTaskVisibility(taskItem, shouldShow, shouldAnimate) {
    const isHidden = taskItem.classList.contains('is-filtered-out');
    const canAnimate = shouldAnimate && motionAllowed && gsap;

    // Cancel an in-flight visibility animation before applying a newer search/filter result.
    if (canAnimate) {
        gsap.killTweensOf(taskItem);

        if (shouldShow && !isHidden) {
            gsap.set(taskItem, { opacity: 1, y: 0 });
        }
    }

    if (shouldShow === !isHidden) {
        return;
    }

    if (!canAnimate) {
        taskItem.classList.toggle('is-filtered-out', !shouldShow);
        return;
    }

    if (shouldShow) {
        taskItem.classList.remove('is-filtered-out');
        gsap.fromTo(taskItem,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' },
        );
        return;
    }

    gsap.to(taskItem, {
        opacity: 0,
        y: -6,
        duration: 0.16,
        ease: 'power2.in',
        onComplete: () => taskItem.classList.add('is-filtered-out'),
    });
}

function setEmptyStateVisibility(shouldShow, shouldAnimate) {
    shouldShow = shouldShow && taskList.children.length > 0;
    const isVisible = emptyState.classList.contains('is-visible');

    if (shouldShow === isVisible) {
        return;
    }

    emptyState.classList.toggle('is-visible', shouldShow);

    if (shouldShow && shouldAnimate && motionAllowed && gsap) {
        gsap.fromTo(emptyState,
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out' },
        );
    }
}

// =======================================
// Toast Notifications
// =======================================

function showToast(message, icon) {
    toastQueue.push({ message, icon });

    if (!activeToast) {
        showNextToast();
    }
}

function showNextToast() {
    const nextToast = toastQueue.shift();

    if (!nextToast) {
        activeToast = null;
        return;
    }

    const toast = document.createElement('div');
    const toastIcon = document.createElement('span');
    const toastMessage = document.createElement('span');

    toast.className = 'toast';
    toastIcon.className = 'toast__icon';
    toastIcon.setAttribute('aria-hidden', 'true');
    toastIcon.textContent = nextToast.icon;
    toastMessage.textContent = nextToast.message;
    toast.append(toastIcon, toastMessage);
    toastRegion.append(toast);
    activeToast = toast;

    if (!motionAllowed || !gsap) {
        window.setTimeout(() => {
            toast.remove();
            showNextToast();
        }, 2600);
        return;
    }

    gsap.timeline({ onComplete: () => {
        toast.remove();
        showNextToast();
    } })
        .fromTo(toast,
            { opacity: 0, y: -12, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' },
        )
        .to(toast, { opacity: 0, y: -8, duration: 0.24, ease: 'power2.in', delay: 2.2 });
}

function updateTaskMeta() {
    const count = taskList.children.length;
    const nextMeta =
        count === 0
            ? 'No tasks yet. Add one above.'
            : `${count} task${count === 1 ? '' : 's'} waiting`;

    if (taskMeta.textContent === nextMeta) {
        return;
    }

    taskMeta.textContent = nextMeta;

    if (motionAllowed && gsap) {
        gsap.fromTo(taskMeta,
            { opacity: 0.35, y: 4 },
            { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' },
        );
    }
}

function animateInterface() {
    if (!motionAllowed || !gsap) {
        return;
    }

    const timeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.42 } });

    timeline
        .from('.hero-panel', { opacity: 0, y: 18, filter: 'blur(8px)', duration: 0.48 })
        .from(['.eyebrow', '.hero-panel h1', '.hero-panel p', '.hero-badge'], {
            opacity: 0,
            y: 10,
            filter: 'blur(5px)',
            stagger: 0.055,
            duration: 0.3,
        }, '-=0.25')
        .from('.task-panel', { opacity: 0, y: 18, filter: 'blur(8px)', duration: 0.46 }, '-=0.26')
        .from(['.task-panel__header', '.task-form'], {
            opacity: 0,
            y: 10,
            filter: 'blur(4px)',
            duration: 0.28,
            stagger: 0.06,
        }, '-=0.25')
        .from('.task-tools', { opacity: 0, y: 8, filter: 'blur(4px)', duration: 0.24 }, '-=0.28');

    timeline.set(['.hero-panel', '.task-panel', '.eyebrow', '.hero-panel h1', '.hero-panel p', '.hero-badge', '.task-panel__header', '.task-form', '.task-tools'], { clearProps: 'filter' });
}

loadTasks();
animateInterface();