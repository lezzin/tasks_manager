auth.onAuthStateChanged(function (user) {
    if (!user) {
        window.location.href = "../index.html";
    }
});

const TASK_STORAGE_KEY = "tasks";

const loader = document.querySelector("[data-loader]");
const mobileButton = document.querySelector("[data-header-btn]");
const logoutButton = document.querySelector('[data-logout]');
const deleteTopicsButton = document.querySelector("[data-delete-topics]");
const deleteTasksButton = document.querySelector("[data-delete-tasks]");

const topicsNav = document.querySelector("[data-topics]");
const tasksContainer = document.querySelector("[data-tasks]");
const topicNameDisplay = document.querySelector("[data-topic-display]");
const taskMessage = document.querySelector("[data-task-message]");

const formAddTask = document.querySelector("[data-add-task]");
const formAddTopic = document.querySelector("[data-add-topic]");

let tasks = getStorage(TASK_STORAGE_KEY, {});
let selectedTopic;

function getCurrentTime() {
    const now = new Date();
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return now.toLocaleDateString('pt-BR', options);
}

function createTopicsList() {
    const isTopicsEmpty = Object.keys(tasks).length <= 0;
    const template = isTopicsEmpty ? '<p class="topic empty">Nenhum tópico cadastrado</p>' : createTopicButtonsHTML();

    deleteTopicsButton.style.display = isTopicsEmpty ? "none" : "flex";
    topicsNav.innerHTML = template;

    addTopicButtonsEventListeners();
}

function createTopicButtonsHTML() {
    return Object.keys(tasks).map(topic => `
        <button class="topic ${selectedTopic == topic ? "active" : ""}">
            <p>${topic}</p>
            <a href="javascript:void(0)" role="button" data-topic-name="${topic}" data-action="delete" title="Deletar tópico" class="btn-rounded">
                <span class="material-icons">delete</span>
            </a>
        </button>`).join('');
}

function addTopicButtonsEventListeners() {
    const deleteTopicButtons = topicsNav.querySelectorAll("[data-action='delete']");

    deleteTopicButtons.forEach(button => {
        button.addEventListener("click", function () {
            const topicName = this.dataset.topicName;
            deleteTopic(topicName);
        });
    });
}

function createTasksTable(withLoader = true) {
    const isTopicEmpty = tasks[selectedTopic]?.length <= 0 || !tasks[selectedTopic];
    const template = isTopicEmpty ? '<p>Nenhuma tarefa cadastrada.</p>' : createTaskRowsHTML();

    if (selectedTopic) {
        const completedTasksLength = Array.from(tasks[selectedTopic]).filter(task => task.status == true).length;
        const allTasksLength = Array.from(tasks[selectedTopic]).length;
        taskMessage.innerText = !isTopicEmpty ? `${completedTasksLength}/${allTasksLength} concluidas` : "";
    }

    if (withLoader) {
        showLoader();

        setTimeout(() => {
            tasksContainer.innerHTML = template;
            deleteTasksButton.style.display = isTopicEmpty ? "none" : "flex";
            addActionButtonsEventListeners();
            hideLoader();
        }, 1000);

        return;
    }

    tasksContainer.innerHTML = template;
    deleteTasksButton.style.display = isTopicEmpty ? "none" : "flex";
    addActionButtonsEventListeners();
}

function createTaskRowsHTML() {
    let html = "";
    tasks[selectedTopic].forEach(task => html += createTaskRow(task));

    return html;
}

function createTaskRow(task) {
    const className = task.status ? `class="task completed"` : `class="task"`;

    return `<div ${className}>
                <div class="left">
                    <button class="btn-rounded" data-task-id="${task.id}" data-action="change-status" title="Alterar status da tarefa">
                        <span class="material-icons">done</span>
                    </button>

                    <div>
                        <p class="task-desc" data-desc>${task.description}</p>
                        <p class="task-date text-muted">${task.date}</p>
                    </div>
                </div>

                <div class="right">
                    <button data-task-id="${task.id}" data-action="delete" title="Deletar tarefa" class="btn-danger">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>`;
}

function showLoader() {
    loader.classList.add("active");
}

function hideLoader() {
    loader.classList.remove("active");
}

function clearTasks() {
    showLoader();

    setTimeout(() => {
        taskMessage.innerText = "";
        tasksContainer.innerHTML = '<p>Selecione um novo tópico.</p>';
        deleteTasksButton.style.display = "none";
        hideLoader();
    }, 1000);
}

function deleteTask(taskId) {
    tasks[selectedTopic] = tasks[selectedTopic].filter(task => task.id !== taskId);

    createTasksTable(false);
    saveStorage(TASK_STORAGE_KEY, tasks);
}

function deleteTopic(name) {
    delete tasks[name];

    if (topicNameDisplay.innerHTML == name) {
        topicNameDisplay.innerHTML = "";
    }

    createTopicsList();
    saveStorage(TASK_STORAGE_KEY, tasks);

    if (selectedTopic == name) {
        clearTasks();
    }
}

function changeTaskStatus(taskId) {
    const taskIndex = tasks[selectedTopic].findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[selectedTopic][taskIndex].status = !tasks[selectedTopic][taskIndex].status;

        createTasksTable(false);
        saveStorage(TASK_STORAGE_KEY, tasks);
    }
}

function deleteAllTasks() {
    tasks[selectedTopic] = [];
    taskMessage.innerText = "";

    createTasksTable();
    saveStorage(TASK_STORAGE_KEY, tasks);
}

function deleteAllTopics() {
    taskMessage.innerText = "";
    topicNameDisplay.innerHTML = "";
    tasks = {};

    createTopicsList();
    saveStorage(TASK_STORAGE_KEY, tasks);
    clearTasks();
}

function addActionButtonsEventListeners() {
    const deleteButtons = tasksContainer.querySelectorAll("[data-action='delete']");
    const changeStatusButtons = tasksContainer.querySelectorAll("[data-action='change-status']");

    deleteButtons.forEach(button => {
        button.addEventListener("click", function () {
            const taskId = parseInt(this.dataset.taskId);
            deleteTask(taskId);
        });
    });

    changeStatusButtons.forEach(button => {
        button.addEventListener("click", function () {
            const taskId = parseInt(this.dataset.taskId);
            changeTaskStatus(taskId);
        });
    });
}

topicsNav.addEventListener("click", function ({ target }) {
    const topicName = target.querySelector('p')?.innerHTML;
    if (!topicName) return;

    selectedTopic = topicName;
    topicNameDisplay.innerHTML = topicName;

    document.body.classList.remove("topics-container-active");
    if (document.querySelector(".topic.active")) {
        document.querySelector(".topic.active").classList.remove("active");
    }
    target.classList.add("active");

    createTasksTable();
});

formAddTopic.addEventListener("submit", function (e) {
    e.preventDefault();

    const newName = this.querySelector("input").value;
    if (tasks[newName]) return;

    tasks[newName] = [];

    createTopicsList();
    saveStorage(TASK_STORAGE_KEY, tasks);
    this.reset();
});

formAddTask.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!tasks[selectedTopic]) return;

    const newId = parseInt(tasks[selectedTopic]?.[tasks[selectedTopic].length - 1]?.id ?? 0) + 1;
    const newDescription = this.querySelector("input").value;
    const task = {
        id: newId,
        description: newDescription,
        date: getCurrentTime(),
        status: false
    };

    tasks[selectedTopic] = tasks[selectedTopic];
    tasks[selectedTopic].push(task);

    createTasksTable(false);
    saveStorage(TASK_STORAGE_KEY, tasks);
    this.reset();
});

deleteTasksButton.addEventListener("click", function () {
    if (confirm("Realmente deseja deletar todas as tarefas relacionadas a esse tópico? Essa ação não poderá ser desfeita.")) {
        deleteAllTasks();
    }
});

deleteTopicsButton.addEventListener("click", function () {
    if (confirm("Realmente deseja deletar todos os tópicos? Essa ação não poderá ser desfeita.")) {
        deleteAllTopics();
    }
});

if (window.matchMedia("(max-width: 768px)").matches) {
    mobileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        document.body.classList.toggle("topics-container-active");
    });

    document.addEventListener('click', function (event) {
        const aside = document.querySelector('.topics-container');
        const isClickInsideAside = aside.contains(event.target);

        if (!isClickInsideAside) {
            document.body.classList.remove("topics-container-active");
        }
    });
}

logoutButton.addEventListener('click', function () {
    auth.signOut().then(function () {
        window.location.href = "../index.html";
    }).catch(function (error) {
        console.error("Erro ao desautenticar usuário:", error);
    });
});

createTopicsList();
createTasksTable();