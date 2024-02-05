auth.onAuthStateChanged(function (user) {
    if (!user) {
        window.location.href = "../index.html";
    }
});

const db = firebase.firestore();
const TASKS_COLLECTION = "users";
const user = JSON.parse(localStorage.getItem("user_data"));
const userUid = user.uid;

const voiceButton = document.querySelector("[data-voice-btn]");
const filterButtons = document.querySelectorAll("[data-filter-btn]");
const downloadTasksButton = document.querySelector("[data-download-tasks]");
const filterBySearchInput = document.querySelector("[data-filter-search]");
const filterStatusButtons = document.querySelectorAll("[data-filter-status]");
const mobileButton = document.querySelector("[data-header-btn]");
const logoutButton = document.querySelector("[data-logout]");
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
let isRecording = false;
let recognition;

function toggleSpeechRecognition() {
    if (!isRecording) {
        startSpeechRecognition();
    } else {
        stopSpeechRecognition();
    }
}

function startSpeechRecognition() {
    const span = document.querySelector('#mic_icon');

    recognition = new webkitSpeechRecognition() || new SpeechRecognition();
    recognition.lang = 'pt-BR';

    recognition.onresult = function (event) {
        const result = event.results[0][0].transcript;
        document.querySelector('#task_desc').value += result;
    };

    recognition.onend = function () {
        span.textContent = 'mic';
        isRecording = false;
    };

    recognition.start();
    span.textContent = 'mic_none';
    isRecording = true;
}

function stopSpeechRecognition() {
    const span = document.querySelector('#mic_icon');

    if (recognition) {
        recognition.stop();
        span.textContent = 'mic';
        isRecording = false;
    }
}

function createNode(element, classes, attributes, innerHTML) {
    const node = document.createElement(element);
    if (classes && classes.forEach((classItem) => {
        node.classList.add(classItem);
    }));
    if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            node.setAttribute(key, value);
        }
    }
    if (innerHTML) {
        node.innerHTML = innerHTML;
    }
    return node;
}

function createTextNode(element, text, className) {
    const node = document.createElement(element);
    node.innerText = text;
    if (className) {
        node.classList.add(className);
    }
    return node;
}

function appendNode(parent, child) {
    parent.appendChild(child);
}

function appendTextNode(parent, element, attributes, text) {
    const node = createTextNode(element, text, attributes);
    parent.appendChild(node);
}

function clearElementChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function triggerClick(element) {
    element.click();
}

function getCurrentTime() {
    return new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
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

function verifyTopicsQuantity(topics) {
    const isEmpty = !topics || topics.length === 0;
    deleteTopicsButton.style.display = isEmpty ? "none" : "flex";

    if (isEmpty) {
        appendNode(topicsNav, createNode("p", ["empty", "topic"], null, "Nenhum tópico cadastrado"));
    }
}

function createTopicButtonHTML(topic) {
    const button = createNode("button", ["topic", selectedTopic === topic ? "active" : "inactive"]);
    button.onclick = function () {
        handleTopicClicked(this);
    };

    const paragraph = createNode("p", null, null, topic);
    const deleteButton = createNode("a", ["btn-rounded"]);

    deleteButton.href = "javascript:void(0)";
    deleteButton.setAttribute("role", "button");
    deleteButton.dataset.topicName = topic;
    deleteButton.title = "Deletar tópico";
    deleteButton.onclick = function (e) {
        e.stopPropagation();
        deleteTopic(this);
    };

    appendNode(deleteButton, createNode("span", ["material-icons"], null, "delete"));
    appendNode(button, paragraph);
    appendNode(button, deleteButton);

    return button;
}

function appendTopicElement(topic) {
    appendNode(topicsNav, createTopicButtonHTML(topic));
}

function createTopicsList(topics) {
    const isEmpty = !topics || topics.length === 0;
    deleteTopicsButton.style.display = isEmpty ? "none" : "flex";
    if (!isEmpty) {
        topics.forEach(topic => appendTopicElement(topic));
    }
}

function deleteTopic(button) {
    const topicName = button.dataset.topicName;
    const topicsChildren = !topicsNav.children[0]?.classList.contains("empty") ? topicsNav.children : [];
    db.collection(TASKS_COLLECTION).doc(userUid).update({
        [`topics.${topicName}`]: firebase.firestore.FieldValue.delete()
    }).then(() => {
        button.parentElement.remove();
        if (topicNameDisplay.innerHTML === topicName) {
            topicNameDisplay.innerHTML = "";
        }
        if (selectedTopic == topicName) {
            clearTasksContainer();
        }
        verifyTopicsQuantity(topicsChildren);
    }).catch((error) => {
        console.error("Erro ao deletar tópico:", error);
    });
}

function deleteAllTopics() {
    if (!confirm("Realmente deseja deletar todos os tópicos? Essa ação não poderá ser desfeita.")) return;
    db.collection(TASKS_COLLECTION).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });

        topicNameDisplay.innerHTML = "";
        selectedTopic = "";
        clearElementChildren(topicsNav);
        verifyTopicsQuantity([]);
        clearTasksContainer();
        disableTasksFilters();

        formAddTask.querySelector("input").disabled = true;
    }).catch((error) => {
        console.error("Erro ao deletar todos os tópicos:", error);
    });
}

function fetchTopics() {
    showTopicsLoader();
    db.collection(TASKS_COLLECTION).doc(userUid).get().then((doc) => {
        const data = doc.data();
        if (data && data.topics) {
            const topics = Object.keys(data.topics);
            verifyTopicsQuantity(topics);
            createTopicsList(topics);
        } else {
            verifyTopicsQuantity([]);
        }
    }).catch((error) => {
        console.error("Erro ao obter tópicos:", error);
    }).finally(() => {
        hideTopicsLoader();
    });
}

function clearTasksContainer() {
    showTasksLoader();

    setTimeout(() => {
        taskMessage.innerText = "";
        deleteTasksButton.style.display = "none";
        downloadTasksButton.disabled = true;

        clearElementChildren(tasksContainer);
        appendTextNode(tasksContainer, "p", null, "Selecione um novo tópico.");
        hideTasksLoader();
    }, 1000);
}

function disableTasksFilters() {
    filterButtons.forEach((button) => {
        button.disabled = true;
    });
    filterBySearchInput.disabled = true;
}

function resetTasksFilters() {
    filterButtons.forEach((button) => {
        button.disabled = false;
        const nextElement = button.nextElementSibling;
        const firstChild = nextElement.firstElementChild;
        removeClass(nextElement.querySelector("button.active"), "active");
        addClass(firstChild, "active");
        triggerClick(firstChild);
    });
    filterBySearchInput.disabled = false;
}

function updateCompletedTasksCounter(tasks) {
    const completedTasks = tasks.filter((task) => task.status === true).length;
    const totalTasks = tasks.length;

    taskMessage.innerText = `${completedTasks}/${totalTasks} concluídas`;
}

function createTaskHTML(task) {
    const classes = task.status ? ["task", "completed"] : ["task", "incompleted"];
    const leftDiv = createNode("div", ["left"]);
    const doneButton = createNode("button", ["btn-rounded"], null, '<span class="material-icons">done</span>');
    doneButton.dataset.taskId = task.id;
    doneButton.title = `Marcar como ${task.status ? "não concluído" : "concluído"}`;
    doneButton.onclick = function () {
        changeTaskStatus(this);
    };
    const taskDiv = createNode("div");
    const descriptionParagraph = createNode("p", ["task-desc"], { "data-desc": task.description }, task.description);
    const dateParagraph = createNode("p", ["task-date", "text-muted"], null, task.date);
    appendNode(taskDiv, descriptionParagraph);
    appendNode(taskDiv, dateParagraph);
    appendNode(leftDiv, doneButton);
    appendNode(leftDiv, taskDiv);
    const rightDiv = createNode("div", ["right"]);
    const deleteButton = createNode("button", ["btn-danger"]);
    deleteButton.dataset.taskId = task.id;
    deleteButton.dataset.action = "delete";
    deleteButton.title = "Deletar tarefa";
    deleteButton.onclick = function () {
        deleteTask(this);
    };
    appendNode(deleteButton, createNode("span", ["material-icons"], null, "delete"));
    appendNode(rightDiv, deleteButton);
    const taskElement = createNode("div", classes);
    appendNode(taskElement, leftDiv);
    appendNode(taskElement, rightDiv);
    return taskElement;
}

function appendTaskElement(task) {
    appendNode(tasksContainer, createTaskHTML(task));
}

function createTasksTable(tasks) {
    const isEmpty = !tasks || tasks.length === 0;
    selectedTopic && !isEmpty && updateCompletedTasksCounter(tasks);
    clearElementChildren(tasksContainer);
    if (isEmpty) {
        appendNode(tasksContainer, createTextNode("p", "Nenhuma tarefa cadastrada."));
    } else {
        tasks.forEach((task) => {
            appendTaskElement(task);
        });
    }
}

function verifyTasksQuantity(tasks) {
    const isEmpty = !tasks || tasks.length === 0;
    deleteTasksButton.style.display = isEmpty ? "none" : "flex";
    taskMessage.style.display = isEmpty ? "none" : "flex";
    downloadTasksButton.disabled = isEmpty;

    if (isEmpty) {
        appendNode(tasksContainer, createTextNode("p", "Nenhuma tarefa cadastrada."));
        disableTasksFilters();
    } else {
        resetTasksFilters();
    }
}

function changeTaskStatus(button) {
    const taskId = parseInt(button.dataset.taskId);
    const taskDiv = button.parentElement.parentElement;
    db.collection(TASKS_COLLECTION).doc(userUid).get().then((doc) => {
        const selectedTopicData = doc.data().topics[selectedTopic];
        if (selectedTopicData && selectedTopicData.tasks) {
            const updatedTasks = selectedTopicData.tasks.map((task) => {
                if (task.id === taskId) {
                    task.status = !task.status;
                    button.title = `Marcar como ${task.status ? "não concluído" : "concluído"}`;
                }
                return task;
            });
            db.collection(TASKS_COLLECTION).doc(userUid).update({
                [`topics.${selectedTopic}.tasks`]: updatedTasks
            }).then(() => {
                taskDiv.classList.toggle("completed", !taskDiv.classList.contains("completed"));
                updateCompletedTasksCounter(updatedTasks);
            }).catch((error) => {
                console.error("Erro ao alterar status da tarefa:", error);
            });
        }
    }).catch((error) => {
        console.error("Erro ao obter tarefas:", error);
    });
}

function deleteTask(button) {
    const taskId = parseInt(button.dataset.taskId);
    const userDoc = db.collection(TASKS_COLLECTION).doc(userUid);
    userDoc.get().then((doc) => {
        const selectedTopicData = doc.data().topics[selectedTopic];
        if (selectedTopicData && selectedTopicData.tasks) {
            const updatedTasks = selectedTopicData.tasks.filter((task) => task.id !== taskId);
            showTasksLoader();
            userDoc.update({
                [`topics.${selectedTopic}.tasks`]: updatedTasks
            }).then(() => {
                button.parentElement.parentElement.remove();
                verifyTasksQuantity(updatedTasks);
            }).catch((error) => {
                console.error("Erro ao deletar tarefa:", error);
            }).finally(() => {
                hideTasksLoader();
            });
        }
    }).catch((error) => {
        console.error("Erro ao obter tarefas:", error);
    });
}

function deleteAllTasks() {
    if (!confirm("Realmente deseja deletar todas as tarefas relacionadas a esse tópico? Essa ação não poderá ser desfeita.")) return;
    const userDoc = db.collection(TASKS_COLLECTION).doc(userUid);
    userDoc.get().then((doc) => {
        const selectedTopicData = doc.data().topics[selectedTopic];
        if (selectedTopicData) {
            userDoc.update({
                [`topics.${selectedTopic}.tasks`]: []
            }).then(() => {
                clearElementChildren(tasksContainer);
                verifyTasksQuantity([]);
            }).catch((error) => {
                console.error("Erro ao deletar todas as tarefas:", error);
            });
        }
    }).catch((error) => {
        console.error("Erro ao obter dados do usuário:", error);
    });
}

function fetchTasks(topic) {
    showTasksLoader();
    db.collection(TASKS_COLLECTION).doc(userUid).get().then((doc) => {
        const userData = doc.data();
        if (userData && userData.topics && userData.topics[topic] && userData.topics[topic].tasks) {
            const tasks = userData.topics[topic].tasks;
            verifyTasksQuantity(tasks);
            createTasksTable(tasks);
        } else {
            createTasksTable([]);
        }
    }).catch((error) => {
        console.error("Erro ao obter tarefas:", error);
    }).finally(() => {
        hideTasksLoader();
    });
}

function handleLogout() {
    auth.signOut().then(() => {
        localStorage.removeItem("user_data");
        window.location.href = "../index.html";
    }).catch((error) => {
        console.error("Erro ao desautenticar usuário:", error);
    });
}

function handleTopicClicked(button) {
    const topicName = button.querySelector("p").innerHTML;
    if (topicName) {
        selectedTopic = topicName;
        topicNameDisplay.innerHTML = topicName;
        document.body.classList.remove("topics-container-active");
        formAddTask.querySelector("input").disabled = false;

        if (document.querySelector(".topic.active")) {
            removeClass(document.querySelector(".topic.active"), "active");
        }
        addClass(button, "active");
        fetchTasks(selectedTopic);
    }
}

function handleFilterButtonClick(button) {
    const dropdown = button.nextElementSibling;
    button.addEventListener("click", () => {
        toggleClass(dropdown, "active");
    });
    document.addEventListener("click", ({ target }) => {
        if (!button.contains(target)) {
            removeClass(dropdown, "active");
        }
    });
}

function handleFilterTasksByStatus(button) {
    button.addEventListener("click", () => {
        const filterStatus = button.dataset.filterStatus;
        const hasDisplayedTasks = tasksContainer.children[0]?.classList.contains("task");
        removeClass(button.parentElement.querySelector("button.active"), "active");
        addClass(button, "active");
        if (hasDisplayedTasks) {
            const allTasks = Array.from(tasksContainer.children);
            showTasksLoader();
            setTimeout(() => {
                allTasks.forEach((task) => {
                    task.style.display = task.classList.contains(filterStatus) ? "flex" : "none";
                });
                if (tasksContainer.querySelectorAll('[style="display: none;"]').length >= tasksContainer.children.length) {
                    appendTextNode(tasksContainer, "p", ["filter-message"], "Nenhuma tarefa encontrada para esse filtro.");
                    taskMessage.style.display = "none";
                    deleteTasksButton.style.display = "none";
                    downloadTasksButton.disabled = true;
                } else {
                    taskMessage.style.display = "";
                    deleteTasksButton.style.display = "flex";
                    downloadTasksButton.disabled = false;
                    const lastTaskElement = tasksContainer.lastElementChild;
                    if (lastTaskElement && lastTaskElement.getAttribute("data-filter-message")) {
                        lastTaskElement.remove();
                    }
                }
                hideTasksLoader();
            }, 1000);
        }
    });
}

function handleFilterByDescription(value) {
    const searchString = String(value).toLocaleLowerCase();
    Array.from(tasksContainer.children).forEach((task) => {
        const description = String(task.querySelector("[data-desc]").textContent).toLowerCase();
        task.style.display = searchString ? (description.includes(searchString) ? "flex" : "none") : "flex";
    });
}

function handleDownloadTasks() {
    const filename = `tarefas_${String(selectedTopic).toLowerCase()}_${getCurrentTime()}`;
    html2pdf().from(tasksContainer).save(filename);
}

formAddTopic.addEventListener("submit", (event) => {
    event.preventDefault();

    const topicName = formAddTopic.querySelector("input").value;
    if (!topicName) return;

    showTopicsLoader();

    const userDoc = db.collection(TASKS_COLLECTION).doc(userUid);
    userDoc.get().then((doc) => {
        const userData = doc.data();

        if (userData && userData.topics && userData.topics[topicName]) {
            hideTopicsLoader();
        } else {
            userDoc.set({}, { merge: true }).then(() => {
                userDoc.update({
                    [`topics.${topicName}`]: { tasks: [] }
                }).then(() => {
                    if (topicsNav.children[0]?.classList.contains("empty")) {
                        clearElementChildren(topicsNav);
                    }

                    verifyTopicsQuantity([topicName]);
                    appendTopicElement(topicName);
                    hideTopicsLoader();
                    formAddTopic.reset();
                }).catch((error) => {
                    console.error("Erro ao adicionar novo tópico:", error);
                }).finally(() => {
                    hideTopicsLoader();
                });
            }).catch((error) => {
                console.error("Erro ao garantir que o documento do usuário exista:", error);
            });
        }
    }).catch((error) => {
        console.error("Erro ao obter dados do usuário:", error);
        hideTopicsLoader();
    });
});

formAddTask.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectedTopic) return;
    const newTask = {
        id: Date.now(),
        description: formAddTask.querySelector("input").value,
        date: getCurrentTime(),
        status: false
    };
    showTasksLoader();
    const userDoc = db.collection(TASKS_COLLECTION).doc(userUid);
    userDoc.get().then((doc) => {
        const selectedTopicData = doc.data().topics[selectedTopic];
        if (selectedTopicData) {
            const tasks = selectedTopicData.tasks || [];
            tasks.push(newTask);
            userDoc.update({
                [`topics.${selectedTopic}.tasks`]: tasks
            }).then(() => {
                updateCompletedTasksCounter(tasks);
                verifyTasksQuantity(tasks);
                const hasDisplayedTasks = tasksContainer.children[0]?.classList.contains("task");
                if (!hasDisplayedTasks) {
                    clearElementChildren(tasksContainer);
                }
                appendTaskElement(newTask);
                formAddTask.reset();
            }).catch((error) => {
                console.error("Erro ao adicionar nova tarefa:", error);
            }).finally(() => {
                hideTasksLoader();
            });
        }
    }).catch((error) => {
        console.error("Erro ao obter dados do usuário:", error);
        hideTasksLoader();
    });
});

downloadTasksButton.addEventListener("click", handleDownloadTasks);
deleteTasksButton.addEventListener("click", deleteAllTasks);
deleteTopicsButton.addEventListener("click", deleteAllTopics);
logoutButton.addEventListener("click", handleLogout);

filterButtons.forEach((button) => {
    handleFilterButtonClick(button);
});

filterStatusButtons.forEach((button) => {
    handleFilterTasksByStatus(button);
});

filterBySearchInput.addEventListener("input", ({ target: { value } }) => {
    handleFilterByDescription(value);
});

voiceButton.addEventListener("click", toggleSpeechRecognition);

if (window.matchMedia("(max-width: 768px)").matches) {
    mobileButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleClass(document.body, "topics-container-active");
    });

    document.addEventListener("click", (event) => {
        if (!document.querySelector(".topics-container").contains(event.target)) {
            removeClass(document.body, "topics-container-active");
        }
    });
}

document.querySelector("[data-user-info]").innerText = user.email;
fetchTopics();