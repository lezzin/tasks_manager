auth.onAuthStateChanged(function (user) {
    if (!user) {
        window.location.href = "../index.html";
    }
});


const db = firebase.firestore();
const TASKS_COLLECTION = "tasks";

// Authenticated user data
const user = JSON.parse(localStorage.getItem("user_data"));
const userUid = user.uid;

const filterButtons = document.querySelectorAll("[data-filter-btn]");
const filterBySearchInput = document.querySelector("[data-filter-search]");
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

// Current topic selected by the user
let selectedTopic;

// Utility functions
function createNode(tag, classes, attributes, innerHTML) {
    const node = document.createElement(tag);

    if (classes) {
        classes.forEach(className => {
            node.classList.add(className);
        })
    };

    if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            node.setAttribute(key, value);
        }
    }

    if (innerHTML) node.innerHTML = innerHTML;

    return node;
}

function createTextNode(tag, text, className) {
    const node = document.createElement(tag);
    node.innerText = text;

    if (className) node.classList.add(className);

    return node;
}

function appendNode(parent, child) {
    parent.appendChild(child);
}

function appendTextNode(parent, tag, text, className) {
    const node = createTextNode(tag, text, className);
    parent.appendChild(node);
}

function clearElementChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function addClass(element, className) {
    element.classList.add(className);
}

function removeClass(element, className) {
    element.classList.remove(className);
}

function toggleClass(element, className) {
    element.classList.toggle(className);
}

function removeClassIfExists(element, className) {
    if (element.classList.contains(className)) {
        element.classList.remove(className);
    }
}

function triggerClick(element) {
    element.click();
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
    const isTopicsEmpty = !topics || topics.length === 0;

    deleteTopicsButton.style.display = isTopicsEmpty ? "none" : "flex";

    if (isTopicsEmpty) {
        appendNode(topicsNav, createNode('p', ['empty', 'topic'], null, 'Nenhum tópico cadastrado'));
    }
}

function createTopicButtonHTML(topicName) {
    const button = createNode('button', ['topic', selectedTopic === topicName ? 'active' : 'inactive']);
    button.onclick = function () {
        handleTopicClicked(this);
    }

    const paragraph = createNode('p', null, null, topicName);

    const deleteButton = createNode('a', ['btn-rounded']);
    deleteButton.href = "javascript:void(0)";
    deleteButton.setAttribute("role", "button");
    deleteButton.dataset.topicName = topicName;
    deleteButton.title = "Deletar tópico";
    deleteButton.onclick = function (event) {
        event.stopPropagation();
        deleteTopic(this);
    };

    const icon = createNode('span', ['material-icons'], null, 'delete');

    appendNode(deleteButton, icon);
    appendNode(button, paragraph);
    appendNode(button, deleteButton);

    return button;
}

function appendTopicElement(topicName) {
    appendNode(topicsNav, createTopicButtonHTML(topicName));
}

function createTopicsList(topics) {
    const isTopicsEmpty = !topics || topics.length === 0;

    deleteTopicsButton.style.display = isTopicsEmpty ? "none" : "flex";

    if (!isTopicsEmpty) {
        topics.forEach(topic => appendTopicElement(topic));
    }
}

function deleteTopic(deleteButton) {
    const topicName = deleteButton.dataset.topicName;
    const firstChildIsTopic = !topicsNav.children[0]?.classList.contains("empty");
    const topicsElements = firstChildIsTopic ? topicsNav.children : [];

    db.collection(TASKS_COLLECTION).doc(userUid + "_" + topicName).delete().then(() => {
        deleteButton.parentElement.remove();

        if (topicNameDisplay.innerHTML == topicName) {
            topicNameDisplay.innerHTML = "";
        }

        console.log(selectedTopic);
        console.log(topicName);

        if (selectedTopic == topicName) {
            clearTasksContainer();
        };

        verifyTopicsQuantity(topicsElements);
    }).catch(error => {
        console.error("Erro ao deletar tópico:", error);
    });
}

function deleteAllTopics() {
    if (!confirm("Realmente deseja deletar todos os tópicos? Essa ação não poderá ser desfeita.")) return;

    db.collection(TASKS_COLLECTION).get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
            doc.ref.delete();
        });

        clearElementChildren(topicsNav);
        verifyTopicsQuantity([]);
        topicNameDisplay.innerHTML = "";
        selectedTopic = "";

        clearTasksContainer();
        disableTasksFilters();
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

            verifyTopicsQuantity(topics);
            createTopicsList(topics);
        })
        .catch(error => {
            console.error("Erro ao obter tópicos:", error);
        })
        .finally(() => {
            hideTopicsLoader();
        });
}

function verifyTasksQuantity(tasks) {
    const isTasksEmpty = !tasks || tasks.length === 0;

    deleteTasksButton.style.display = isTasksEmpty ? "none" : "flex";
    taskMessage.style.display = isTasksEmpty ? "none" : "flex";

    if (isTasksEmpty) {
        appendNode(tasksContainer, createTextNode('p', 'Nenhuma tarefa cadastrada.'));
        disableTasksFilters();
    } else {
        resetTasksFilters();
    }
}

function clearTasksContainer() {
    showTasksLoader();

    setTimeout(() => {
        taskMessage.innerText = "";
        clearElementChildren(tasksContainer);
        appendTextNode(tasksContainer, 'p', 'Selecione um novo tópico.');
        deleteTasksButton.style.display = "none";
        hideTasksLoader();
    }, 1000);
}

function disableTasksFilters() {
    filterButtons.forEach(function (button) {
        button.disabled = true;
    });

    filterBySearchInput.disabled = true;
}

function resetTasksFilters() {
    filterButtons.forEach(function (button) {
        button.disabled = false;

        const filterDropdown = button.nextElementSibling;
        const firstFilterElement = filterDropdown.firstElementChild;

        removeClass(filterDropdown.querySelector("button.active"), "active");
        addClass(firstFilterElement, "active");
        triggerClick(firstFilterElement);
    });

    filterBySearchInput.disabled = false;
}

function updateCompletedTasksCounter(tasks) {
    const completedTasksLength = tasks.filter(task => task.status == true).length;
    const allTasksLength = tasks.length;

    taskMessage.innerText = `${completedTasksLength}/${allTasksLength} concluídas`;
}

function createTaskHTML(task) {
    const classNames = task.status ? ['task', 'completed'] : ['task', 'incompleted'];

    const divLeft = createNode('div', ['left']);
    const buttonChangeStatus = createNode('button', ['btn-rounded'], null, '<span class="material-icons">done</span>');
    buttonChangeStatus.dataset.taskId = task.id;
    buttonChangeStatus.title = 'Alterar status da tarefa';
    buttonChangeStatus.onclick = function () {
        changeTaskStatus(this);
    };

    const div = createNode('div');
    const pDescription = createNode('p', ['task-desc'], { 'data-desc': task.description }, task.description);
    const pDate = createNode('p', ['task-date', 'text-muted'], null, task.date);

    appendNode(div, pDescription);
    appendNode(div, pDate);

    appendNode(divLeft, buttonChangeStatus);
    appendNode(divLeft, div);

    const divRight = createNode('div', ['right']);
    const buttonDelete = createNode('button', ['btn-danger']);
    buttonDelete.dataset.taskId = task.id;
    buttonDelete.dataset.action = 'delete';
    buttonDelete.title = 'Deletar tarefa';
    buttonDelete.onclick = function () {
        deleteTask(this);
    };

    const spanDelete = createNode('span', ['material-icons'], null, 'delete');

    appendNode(buttonDelete, spanDelete);
    appendNode(divRight, buttonDelete);

    const divTask = createNode('div', classNames);
    appendNode(divTask, divLeft);
    appendNode(divTask, divRight);

    return divTask;
}

function appendTaskElement(task) {
    appendNode(tasksContainer, createTaskHTML(task));
}

function createTasksTable(tasks) {
    const isTasksEmpty = !tasks || tasks.length === 0;

    if (selectedTopic && !isTasksEmpty) {
        updateCompletedTasksCounter(tasks);
    }

    clearElementChildren(tasksContainer);

    if (isTasksEmpty) {
        appendNode(tasksContainer, createTextNode('p', 'Nenhuma tarefa cadastrada.'));
    } else {
        tasks.forEach(task => appendTaskElement(task));
    }
}

function verifyTasksQuantity(tasks) {
    const isTasksEmpty = !tasks || tasks.length === 0;

    deleteTasksButton.style.display = isTasksEmpty ? "none" : "flex";
    taskMessage.style.display = isTasksEmpty ? "none" : "flex";

    if (isTasksEmpty) {
        appendNode(tasksContainer, createTextNode('p', 'Nenhuma tarefa cadastrada.'));
        disableTasksFilters();
    } else {
        resetTasksFilters();
    }
}

function deleteTask(deleteButton) {
    const taskId = parseInt(deleteButton.dataset.taskId);
    const task = deleteButton.parentElement.parentElement;

    const taskRef = db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic);

    taskRef.get().then(doc => {
        if (doc.exists) {
            const tasks = doc.data().tasks;
            const updatedTasks = tasks.filter(task => task.id !== taskId);

            showTasksLoader();

            taskRef.update({
                tasks: updatedTasks
            }).then(() => {
                task.remove();

                const isTasksEmpty = !updatedTasks || updatedTasks.length === 0;

                if (selectedTopic && !isTasksEmpty) {
                    updateCompletedTasksCounter(updatedTasks);
                }

                verifyTasksQuantity(updatedTasks);
            }).catch(error => {
                console.error("Erro ao deletar tarefa:", error);
            }).finally(() => {
                hideTasksLoader();
            });
        }
    }).catch(error => {
        console.error("Erro ao obter tarefas:", error);
    });
}

function changeTaskStatus(buttonChangeStatus) {
    const taskId = parseInt(buttonChangeStatus.dataset.taskId);
    const taskElement = buttonChangeStatus.parentElement.parentElement;

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
                taskElement.classList.toggle("completed", !taskElement.classList.contains("completed"));
                updateCompletedTasksCounter(updatedTasks);
            }).catch(error => {
                console.error("Erro ao alterar status da tarefa:", error);
            });
        }
    }).catch(error => {
        console.error("Erro ao obter tarefas:", error);
    });
}

function deleteAllTasks() {
    if (!confirm("Realmente deseja deletar todas as tarefas relacionadas a esse tópico? Essa ação não poderá ser desfeita.")) return;

    db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic)
        .update({
            tasks: []
        }).then(() => {
            clearElementChildren(tasksContainer);
            verifyTasksQuantity([]);
        }).catch(error => {
            console.error("Erro ao deletar todas as tarefas:", error);
        });
}

function fetchTasks(topic) {
    showTasksLoader();

    db.collection(TASKS_COLLECTION).doc(userUid + "_" + topic)
        .get()
        .then(doc => {
            if (doc.exists) {
                const tasks = doc.data().tasks;

                verifyTasksQuantity(tasks);
                createTasksTable(tasks);
            } else {
                createTasksTable([]);
            }
        })
        .catch(error => {
            console.error("Erro ao obter tarefas:", error);
        })
        .finally(() => {
            hideTasksLoader();
        });
}

function handleLogout() {
    auth.signOut().then(function () {
        localStorage.removeItem("user_data");
        window.location.href = "../index.html";
    }).catch(function (error) {
        console.error("Erro ao desautenticar usuário:", error);
    });
}

function handleTopicClicked(element) {
    const topicName = element.querySelector('p').innerHTML;
    if (!topicName) return;

    selectedTopic = topicName;
    topicNameDisplay.innerHTML = topicName;

    document.body.classList.remove("topics-container-active");

    if (document.querySelector(".topic.active")) {
        removeClass(document.querySelector(".topic.active"), "active");
    }

    addClass(element, "active");
    fetchTasks(selectedTopic);
}

function handleFilterButtonClick(button) {
    const dropdown = button.nextElementSibling;

    button.addEventListener("click", function () {
        toggleClass(dropdown, "active");
    })

    document.addEventListener('click', function ({ target }) {
        const isClickInsideButton = button.contains(target);

        if (!isClickInsideButton) {
            removeClass(dropdown, "active");
        }
    });
}

function handleFilterTasksByStatus(button) {
    button.addEventListener('click', function () {
        const statusFilter = button.dataset.filterStatus;
        const firstChildIsTask = tasksContainer.children[0]?.classList.contains("task");
        const tasksElements = Array.from(tasksContainer.children);
        const dropdown = button.parentElement;

        console.log(tasksElements);

        removeClass(dropdown.querySelector("button.active"), "active");
        addClass(button, "active");

        if (firstChildIsTask) {
            showTasksLoader();

            setTimeout(() => {
                tasksElements.forEach(function (task) {
                    task.style.display = task.classList.contains(statusFilter) ? "flex" : "none";
                })

                const hiddenElementsLength = tasksContainer.querySelectorAll(`[style="display: none;"]`).length;
                const childrenElementsLength = tasksContainer.children.length;

                if (hiddenElementsLength >= childrenElementsLength) {
                    appendTextNode(tasksContainer, 'p', 'Nenhuma tarefa encontrada para esse filtro.', 'filter-message');
                    taskMessage.style.display = "none";
                    deleteTasksButton.style.display = "none";
                } else {
                    taskMessage.style.display = "";
                    deleteTasksButton.style.display = "flex";

                    const filterMessageElement = tasksContainer.lastElementChild;
                    if (filterMessageElement && filterMessageElement.getAttribute("data-filter-message")) {
                        filterMessageElement.remove();
                    }
                }

                hideTasksLoader();
            }, 1000);
        }
    });
}

function handleFilterByDescription(search) {
    const searchValue = String(search).toLocaleLowerCase();
    const tasksContainerElements = Array.from(tasksContainer.children);

    tasksContainerElements.forEach(element => {
        const elementValue = String(element.querySelector("[data-desc]").textContent).toLowerCase();

        if (!searchValue) {
            element.style.display = "flex";
        } else {
            element.style.display = elementValue.includes(searchValue) ? "flex" : "none";
        }
    })
}

formAddTopic.addEventListener("submit", function (event) {
    event.preventDefault();

    const newName = this.querySelector("input").value;
    if (!newName) return;

    showTopicsLoader();
    db.collection(TASKS_COLLECTION).doc(userUid + "_" + newName)
        .set({ tasks: [] })
        .then(() => {
            const firstChildIsTopic = !topicsNav.children[0]?.classList.contains("empty");
            if (!firstChildIsTopic) {
                clearElementChildren(topicsNav);
            }

            verifyTopicsQuantity([newName]);
            appendTopicElement(newName);
            hideTopicsLoader();
            this.reset();
        })
        .catch(error => {
            console.error("Erro ao adicionar novo tópico:", error);
        });
});

formAddTask.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!selectedTopic) return;

    const newId = Date.now();
    const newDescription = this.querySelector("input").value;
    const task = {
        id: newId,
        description: newDescription,
        date: getCurrentTime(),
        status: false
    };

    showTasksLoader();
    db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic)
        .update({
            tasks: firebase.firestore.FieldValue.arrayUnion(task)
        })
        .then(() => {
            const firstChildIsTask = tasksContainer.children[0]?.classList.contains("task");

            db.collection(TASKS_COLLECTION).doc(userUid + "_" + selectedTopic)
                .get()
                .then(doc => {
                    const tasks = doc.data().tasks;

                    updateCompletedTasksCounter(tasks);
                    verifyTasksQuantity(tasks);
                })

            if (!firstChildIsTask) {
                clearElementChildren(tasksContainer);
            }

            appendTaskElement(task);
            this.reset();
        })
        .catch(error => {
            console.error("Erro ao adicionar nova tarefa:", error);
        })
        .finally(() => {
            hideTasksLoader();
        });
});

deleteTasksButton.addEventListener("click", deleteAllTasks);
deleteTopicsButton.addEventListener("click", deleteAllTopics);

logoutButton.addEventListener('click', handleLogout);

filterButtons.forEach(button => handleFilterButtonClick(button));
filterStatusButtons.forEach(button => handleFilterTasksByStatus(button));

filterBySearchInput.addEventListener("input", ({ target: { value } }) => handleFilterByDescription(value));

if (window.matchMedia("(max-width: 768px)").matches) {
    mobileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleClass(document.body, "topics-container-active");
    });

    document.addEventListener('click', function (event) {
        const aside = document.querySelector('.topics-container');
        const isClickInsideAside = aside.contains(event.target);

        if (!isClickInsideAside) {
            removeClass(document.body, "topics-container-active");
        }
    });
}

document.querySelector("[data-user-info]").innerText = user.email;
fetchTopics();
