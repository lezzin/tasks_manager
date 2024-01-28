const TASK_STORAGE_KEY = "tasks";
const THEME_STORAGE_KEY = "theme";

const loader = document.querySelector("[data-loader]");
const mobileBtn = document.querySelector("[data-header-btn]");
const themeBtn = document.querySelector("[data-change-theme]");
const deleteTopicsBtn = document.querySelector("[data-delete-topics]");
const deleteTasksBtn = document.querySelector("[data-delete-tasks]");

const topicsNav = document.querySelector("[data-topics]");
const tasksTable = document.querySelector("[data-tasks]");

const formAddTask = document.querySelector("[data-add-task]");
const formAddTopic = document.querySelector("[data-add-topic]");
const formSearchTask = document.querySelector("[data-search-tasks]");

let tasks = getTaskStorage();
let selectedTopic = Object.keys(tasks)[0];

function saveTaskStorage() {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
}

function getTaskStorage() {
    return JSON.parse(localStorage.getItem(TASK_STORAGE_KEY)) || {};
}

function getThemeStorage() {
    return JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)) || "light";
}

function saveThemeStorage() {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(document.body.dataset.theme));
}

function loadTheme() {
    let selectedTheme = getThemeStorage();
    document.body.dataset.theme = selectedTheme;
}

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

    deleteTopicsBtn.style.display = isTopicsEmpty ? "none" : "flex";

    topicsNav.innerHTML = template;
    topicsNav.querySelector('.topic').classList.add("active");

    addTopicButtonsEventListeners();
}

function createTopicButtonsHTML() {
    return Object.keys(tasks).map(topic => `
        <button class="topic">
            <p>${topic}</p>
            <a href="javascript:void(0)" role="button" data-topic-name="${topic}" data-action="delete">
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
    const template = isTopicEmpty ? '<tr class="last-row"><td colspan="5" class="message-cell">Nenhuma tarefa cadastrada.</td></tr>' : createTaskRowsHTML();

    deleteTasksBtn.style.display = isTopicEmpty ? "none" : "flex";

    if (withLoader) {
        showLoader();
        setTimeout(() => {
            tasksTable.innerHTML = template;
            hideLoader();
            addActionButtonsEventListeners();
        }, 1000);
    } else {
        tasksTable.innerHTML = template;
        hideLoader();
        addActionButtonsEventListeners();
    }
}

function createTaskRowsHTML() {
    const taskRows = tasks[selectedTopic].map(task => createTaskRow(task));
    const lastTaskIndex = taskRows.length - 1;
    taskRows[lastTaskIndex] = taskRows[lastTaskIndex].replace('<tr', '<tr last-row ');

    return taskRows.join('');
}

function createTaskRow(task) {
    const status = task.status ? "Concluída" : "Não concluída";
    const statusClass = task.status ? `class="completed-cell-task"` : "";

    return `<tr ${statusClass}>
        <td>${task.id}</td>
        <td data-desc>${task.description}</td>
        <td>${task.date}</td>
        <td>${status}</td>
        <td class="actions-cell">
            <button data-task-id="${task.id}" data-action="delete">
                <span class="material-icons">delete</span>
            </button>
            <button data-task-id="${task.id}" data-action="change-status">
                <span class="material-icons">done</span>
            </button>
        </td>
    </tr>`;
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
        tasksTable.innerHTML = '<tr class="last-row"><td colspan="5" class="message-cell">Selecione um novo tópico.</td></tr>';
        hideLoader();
    }, 1000);
}

function deleteTask(taskId) {
    tasks[selectedTopic] = tasks[selectedTopic].filter(task => task.id !== taskId);

    createTasksTable(false);
    saveTaskStorage();
}

function deleteTopic(name) {
    delete tasks[name];

    createTopicsList();
    clearTasks();
    saveTaskStorage();
}

function changeTaskStatus(taskId) {
    const taskIndex = tasks[selectedTopic].findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[selectedTopic][taskIndex].status = !tasks[selectedTopic][taskIndex].status;

        createTasksTable(false);
        saveTaskStorage();
    }
}

function deleteAllTasks() {
    tasks[selectedTopic] = [];
    createTasksTable();
    saveTaskStorage();
}

function deleteAllTopics() {
    tasks = {};

    createTopicsList();
    clearTasks();
    saveTaskStorage();
}

function addActionButtonsEventListeners() {
    const deleteButtons = tasksTable.querySelectorAll("[data-action='delete']");
    const changeStatusButtons = tasksTable.querySelectorAll("[data-action='change-status']");

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

    document.body.classList.remove("topics-container-active");

    document.querySelector(".topic.active").classList.remove("active");
    target.classList.add("active");

    createTasksTable();
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
    saveTaskStorage();
    this.reset();
});

formAddTopic.addEventListener("submit", function (e) {
    e.preventDefault();

    const newName = this.querySelector("input").value;
    tasks[newName] = [];

    createTopicsList();
    saveTaskStorage();
    this.reset();
});

formSearchTask.addEventListener("input", function ({ target: { value } }) {
    const tableTds = tasksTable.querySelectorAll("td[data-desc]");

    tableTds.forEach(element => {
        const elementValue = String(element.textContent).toLocaleLowerCase();
        const searchedValue = String(value).toLocaleLowerCase();

        element.parentElement.style.display = (elementValue.includes(searchedValue)) ? "table-row" : "none";
    });
});

mobileBtn.addEventListener("touchstart", function (e) {
    e.preventDefault();
    document.body.classList.toggle("topics-container-active");
});

deleteTasksBtn.addEventListener("click", function () {
    deleteAllTasks();
});

deleteTopicsBtn.addEventListener("click", function () {
    deleteAllTopics();
});

themeBtn.addEventListener("click", function () {
    document.body.dataset.theme = (document.body.dataset.theme == "light") ? "dark" : "light";
    saveThemeStorage();
});

loadTheme();
createTopicsList();
createTasksTable();