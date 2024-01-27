const topicsNav = document.querySelector("[data-topics]");
const tasksTable = document.querySelector("[data-tasks]");

const formAddTask = document.querySelector("[data-add-task]");
const formAddTopic = document.querySelector("[data-add-topic]");

const formSearchTask = document.querySelector("[data-search-tasks]");

let tasks = {
    "Estudo": [],
    "Lazer": [],
    "Programação": [],
}

let selectedTopic = Object.keys(tasks)[0];

function createTopicsList() {
    let html = "";

    Object.keys(tasks).forEach(topic => {
        html += `<button class="topic">${topic}</button>`;
    })

    topicsNav.innerHTML = html;
    topicsNav.children[0].classList.add("active");
}

function createTasksTable() {
    let html = "";

    if (tasks[selectedTopic].length <= 0) {
        html += `<tr>
                    <td colspan="4" class="empty">Nenhuma tarefa cadastrada.</td>
                </tr>`;
    } else {
        tasks[selectedTopic].forEach(task => {
            html += ` <tr>
                    <td>${task?.id}</td>
                    <td data-desc>${task?.description}</td>
                    <td>${task?.date}</td>
                    <td>${task?.status}</td>
                </tr>`;
        })
    }

    tasksTable.innerHTML = html;
}

createTopicsList();
createTasksTable();

topicsNav.addEventListener("click", function ({ target }) {
    const topicName = target.textContent;
    selectedTopic = topicName;

    document.querySelector(".topic.active").classList.remove("active");
    target.classList.add("active");

    createTasksTable();
})

formAddTask.addEventListener("submit", function (e) {
    e.preventDefault();

    const newId = parseInt(tasks[selectedTopic][tasks[selectedTopic].length - 1]?.id ?? 0) + 1
    const newDescription = this.querySelector("input").value;

    const task = {
        id: newId,
        description: newDescription,
        date: Date.now(),
        status: "Não concluído"
    }

    tasks[selectedTopic].push(task);
    createTasksTable();

    this.reset();
})

formAddTopic.addEventListener("submit", function (e) {
    e.preventDefault();

    const newName = this.querySelector("input").value;
    tasks[newName] = [];

    createTopicsList();

    this.reset();
})

formSearchTask.addEventListener("input", function ({ target: { value } }) {
    const tableTds = tasksTable.querySelectorAll("td[data-desc]");

    tableTds.forEach(element => {
        const elementValue = String(element.textContent).toLocaleLowerCase();
        const searchedValue = String(value).toLocaleLowerCase();

        element.parentElement.style.display = (elementValue.includes(searchedValue)) ? " table-row" : "none";
    })
})