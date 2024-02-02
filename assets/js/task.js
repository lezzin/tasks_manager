auth.onAuthStateChanged(function (user) {
    if (!user) {
        window.location.href = "../index.html";
    }
});

const db = firebase.firestore();
const TASKS_COLLECTION = "tasks";

const user = JSON.parse(localStorage.getItem("user_data"));
const userUid = user.uid;

const filterButtons = document.querySelectorAll(".filter-options .btn-select");
const filterStatusButtons = document.querySelectorAll("[data-filter-status]");
const mobileButton = document.querySelector("[data-header-btn]");
const logoutButton = document.querySelector('[data-logout]');
const deleteTopicsButton = document.querySelector("[data-delete-topics]");
const deleteTasksButton = document.querySelector("[data-delete-tasks]");

const topicsNav = document.querySelector("[data-topics]");
const tasksContainer = document.querySelector("[data-tasks]");
const topicNameDisplay = document.querySelector("[data-topic-display]");
const taskMessage = document.querySelector("[data-task-message]");
const tasksLoader = document.querySelector("[data-tasks-loader]");
const topicsLoader = document.querySelector("[data-topics-loader]");

const formAddTask = document.querySelector("[data-add-task]");
const formAddTopic = document.querySelector("[data-add-topic]");

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

function showTasksLoader() {
    tasksLoader.classList.add("active");
}

function hideTasksLoader() {
    tasksLoader.classList.remove("active");
}

function showTopicsLoader() {
    topicsLoader.classList.add("active");
}

function hideTopicsLoader() {
    topicsLoader.classList.remove("active");
}

function clearTasks() {
    showTasksLoader();

    setTimeout(() => {
        taskMessage.innerText = "";
        tasksContainer.innerHTML = '<p>Selecione um novo tópico.</p>';
        deleteTasksButton.style.display = "none";
        hideTasksLoader();
    }, 1000);
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

function createTopicsList(topics) {
    const isTopicsEmpty = !topics || topics.length === 0;
    const template = isTopicsEmpty ? '<p class="topic empty">Nenhum tópico cadastrado</p>' : createTopicButtonsHTML(topics);

    deleteTopicsButton.style.display = isTopicsEmpty ? "none" : "flex";
    topicsNav.innerHTML = template;

    addTopicButtonsEventListeners();
}

function createTopicButtonsHTML(topics) {
    return topics.map(topic => `
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

function createTasksTable(tasks) {
    const isTopicEmpty = !tasks || tasks.length === 0;
    const template = isTopicEmpty ? '<p>Nenhuma tarefa cadastrada.</p>' : createTaskRowsHTML(tasks);

    if (selectedTopic) {
        const completedTasksLength = tasks.filter(task => task.status == true).length;
        const allTasksLength = tasks.length;
        taskMessage.innerText = !isTopicEmpty ? `${completedTasksLength}/${allTasksLength} concluídas` : "";
    }

    tasksContainer.innerHTML = template;
    deleteTasksButton.style.display = isTopicEmpty ? "none" : "flex";
    addActionButtonsEventListeners();
}

function createTaskRowsHTML(tasks) {
    return tasks.map(task => createTaskRow(task)).join('');
}

function createTaskRow(task) {
    const className = task.status ? `class="task completed"` : `class="task incompleted"`;

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

function deleteTask(taskId) {
    const taskRef = db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic);

    taskRef.get().then(doc => {
        if (doc.exists) {
            const tasks = doc.data().tasks;
            const updatedTasks = tasks.filter(task => task.id !== taskId);

            taskRef.update({
                tasks: updatedTasks
            }).then(() => {
                fetchTasks(selectedTopic);
            }).catch(error => {
                console.error("Erro ao deletar tarefa:", error);
            });
        }
    }).catch(error => {
        console.error("Erro ao obter tarefas:", error);
    });
}

function deleteTopic(name) {
    db.collection(TASKS_COLLECTION).doc(userUid + "_" + name).delete().then(() => {
        if (topicNameDisplay.innerHTML == name) {
            topicNameDisplay.innerHTML = "";
        }

        fetchTopics();
        if (selectedTopic == name) clearTasks();
    }).catch(error => {
        console.error("Erro ao deletar tópico:", error);
    });
}

function changeTaskStatus(taskId) {
    const taskRef = db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic);

    taskRef.get().then(doc => {
        if (doc.exists) {
            const tasks = doc.data().tasks;
            const updatedTasks = tasks.map(task => {
                if (task.id === taskId) {
                    task.status = !task.status;
                }

                return task;
            });

            taskRef.update({
                tasks: updatedTasks
            }).then(() => {
                fetchTasks(selectedTopic);
            }).catch(error => {
                console.error("Erro ao alterar status da tarefa:", error);
            });
        }
    }).catch(error => {
        console.error("Erro ao obter tarefas:", error);
    });
}

function deleteAllTasks() {
    db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic).update({
        tasks: []
    }).then(() => {
        fetchTasks(selectedTopic);
    }).catch(error => {
        console.error("Erro ao deletar todas as tarefas:", error);
    });
}

function deleteAllTopics() {
    db.collection(TASKS_COLLECTION).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });

        fetchTopics();
        clearTasks();
    }).catch(error => {
        console.error("Erro ao deletar todos os tópicos:", error);
    });
}

function fetchTopics() {
    showTopicsLoader();

    db.collection(TASKS_COLLECTION)
        .where(firebase.firestore.FieldPath.documentId(), ">=", userUid)
        .where(firebase.firestore.FieldPath.documentId(), "<", userUid + "\uf8ff")
        .get()
        .then(querySnapshot => {
            const topics = querySnapshot.docs.map(doc => doc.id.split("_")[1]);

            createTopicsList(topics);
            hideTopicsLoader();
        })
        .catch(error => {
            console.error("Erro ao obter tópicos:", error);
        });
}

function fetchTasks(topic) {
    showTasksLoader();

    db.collection(TASKS_COLLECTION).doc(userUid + "_" + topic).get()
        .then(doc => {
            if (doc.exists) {
                const tasks = doc.data().tasks;
                createTasksTable(tasks);
            } else {
                createTasksTable([]);
            }

            hideTasksLoader();
        })
        .catch(error => {
            console.error("Erro ao obter tarefas:", error);
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

    fetchTasks(selectedTopic);
});

formAddTopic.addEventListener("submit", function (e) {
    e.preventDefault();

    const newName = this.querySelector("input").value;
    if (!newName) return;

    db.collection(TASKS_COLLECTION).doc(userUid + "_" + newName).set({ tasks: [] })
        .then(() => {
            fetchTopics();
            this.reset();
        })
        .catch(error => {
            console.error("Erro ao adicionar novo tópico:", error);
        });
});

formAddTask.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedTopic) return;

    const newId = Date.now();
    const newDescription = this.querySelector("input").value;
    const task = {
        id: newId,
        description: newDescription,
        date: getCurrentTime(),
        status: false
    };

    db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic).update({
        tasks: firebase.firestore.FieldValue.arrayUnion(task)
    })
        .then(() => {
            fetchTasks(selectedTopic);
            this.reset();
        })
        .catch(error => {
            console.error("Erro ao adicionar nova tarefa:", error);
        });
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
        localStorage.removeItem("user_data");
        window.location.href = "../index.html";
    }).catch(function (error) {
        console.error("Erro ao desautenticar usuário:", error);
    });
});

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        this.querySelector(".btn-select-options").classList.toggle("active");
    })

    document.addEventListener('click', function (event) {
        const isClickInsideButton = button.contains(event.target);

        if (!isClickInsideButton) {
            button.querySelector(".btn-select-options").classList.remove("active");
        }
    });
})

filterStatusButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const statusFilter = button.dataset.filterStatus;

        if (tasksContainer.children[0]?.classList.contains("task")) {
            Array.from(tasksContainer.children).forEach(function (topic) {
                topic.style.display = topic.classList.contains(statusFilter) ? "flex" : "none";
            })
        }
    });
})

document.querySelector("[data-user-info]").innerText = user.email;
fetchTopics();
