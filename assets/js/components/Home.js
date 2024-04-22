import {
    PAGE_TITLES,
    TASK_PRIORITIES,
    currentTime,
    formatDate
} from "../utils.js";

const Home = {
    template: "#home-page",
    props: ["db", "auth"],
    data() {
        return {
            user: this.$root.user,
            isMenuTopicsActive: this.$root.isMenuTopicsActive,

            topics: null,
            selectedTopic: null,
            loadedTopics: false,

            newTopic: '',
            formTopicError: '',

            addingTask: false,
            formTaskError: '',
            addNewTaskName: '',
            addNewTaskComment: '',
            addNewTaskDate: '',
            addNewTaskPriority: TASK_PRIORITIES.small,
            isListening: false,
            recognition: null,

            topicOldName: null,
            topicNewName: '',
            topicEditingError: '',
            editingTopic: false,

            editTaskId: null,
            editNewTaskName: '',
            editNewTaskNameError: '',
            editNewTaskPriority: '',
            editNewTaskPriorityError: '',
            editNewTaskComment: '',
            editNewTaskDate: '',
            editingTask: false,

            defaultTasks: [],
            searchTask: "",
            filterTask: 'all',

            selectedComment: null,
            showingComment: false,
        }
    },
    methods: {
        formatDate(date) {
            return formatDate(date)
        },

        toggleSpeechRecognition(action) {
            if (!this.isListening) {
                this.startSpeechRecognition(action);
            } else {
                this.stopSpeechRecognition();
            }
        },
        startSpeechRecognition(action) {
            this.isListening = true;
            this.recognition = new window.webkitSpeechRecognition();
            this.recognition.lang = 'pt-BR';
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const result = event.results[0][0].transcript;

                switch (action) {
                    case 'addTask':
                        this.addNewTaskName = result;
                        break;
                    case 'editTask':
                        this.editNewTaskName = result;
                        break;
                    default:
                        this.addNewTaskName = result;
                        break;
                }
                this.stopSpeechRecognition();
            };

            this.recognition.onerror = (_event) => {
                this.stopSpeechRecognition();
            };

            this.recognition.onend = () => {
                this.isListening = false;
            };

            this.recognition.start();
        },
        stopSpeechRecognition() {
            if (this.recognition) {
                this.recognition.stop();
                this.recognition = null;
            }
            this.isListening = false;
        },

        loadTopic(id) {
            this.selectedTopic = this.$root.selectedTopicName = null;

            if (!this.topics) {
                if (this.$router.history.current.fullPath != "/") this.$router.push("/");
                return;
            }

            const topic = this.topics.find(topic => topic.id == id);

            if (!topic) {
                if (this.$router.history.current.fullPath != "/") this.$router.push("/");
                return;
            }

            this.selectedTopic = topic;
            this.defaultTasks = topic.tasks;
            this.$root.selectedTopicName = topic.name;
            this.sortTasksByPriority();
        },
        addTopic() {
            this.formTopicError = '';

            if (!this.newTopic) {
                this.formTopicError = "Preencha o campo"
                return;
            }

            if (String(this.newTopic).replaceAll(".", "").length <= 3) {
                this.formTopicError = "Insira pelo menos 4 letras!";
                return;
            }

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef
                .get()
                .then((doc) => {
                    const userData = doc.data();

                    if (userData && userData.topics && userData.topics[this.newTopic]) {
                        this.formTopicError = "Esse tópico já existe";
                        return;
                    }

                    const formattedNewTopicName = String(this.newTopic).replaceAll(".", "");

                    docRef
                        .set({}, {
                            merge: true
                        })
                        .then(() => {
                            return docRef.update({
                                [`topics.${formattedNewTopicName}`]: {
                                    id: Date.now().toString(26),
                                    name: formattedNewTopicName,
                                    tasks: [],
                                    created_at: currentTime(),
                                }
                            });
                        })
                        .then(() => {
                            this.$root.toast = {
                                type: "success",
                                text: "Tópico criado com sucesso"
                            };
                            this.newTopic = '';
                        })
                        .catch((error) => {
                            this.$root.toast = {
                                type: "error",
                                text: "Erro ao criar tópico: " + error,
                            }
                        });
                })
                .catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter dados do usuário: " + error,
                    }
                });
        },
        editTopic() {
            this.topicEditingError = "";

            if (!this.topicNewName) {
                this.topicEditingError = "Preencha o campo de edição";
                return;
            }

            if (String(this.topicNewName).replaceAll(".", "").length <= 3) {
                this.topicEditingError = "Insira pelo menos 4 letras!";
                return;
            }

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            const formattedNewTopicName = String(this.topicNewName).replaceAll(".", "");

            docRef
                .get()
                .then((doc) => {
                    const userData = doc.data();
                    if (userData && userData.topics && userData.topics[this.topicOldName]) {
                        const selectedTopicData = userData.topics[this.topicOldName];
                        if (this.topicNewName == this.topicOldName) return;

                        if (userData.topics[formattedNewTopicName]) {
                            this.topicEditingError = "Esse tópico já existe";
                            return Promise.reject("Esse tópico já existe");
                        }

                        const updatedTopics = {
                            ...userData.topics
                        };
                        updatedTopics[formattedNewTopicName] = selectedTopicData;
                        updatedTopics[formattedNewTopicName].name = formattedNewTopicName;
                        delete updatedTopics[this.topicOldName];

                        return docRef.update({
                            topics: updatedTopics
                        });
                    }

                    return Promise.reject("Tópico não encontrado");
                })
                .then(() => {
                    this.closeEditingTopic();
                    this.$root.toast = {
                        type: "success",
                        text: "Tópico atualizado com sucesso"
                    };
                })
                .catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao alterar tópico: " + error
                    };
                });
        },
        deleteTopic(topicName) {
            if (!confirm("Tem certeza que deseja excluir esse tópico? Essa ação não poderá ser desfeita!")) return;

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef
                .get()
                .then((doc) => {
                    const userData = doc.data();
                    const topicExists = userData && userData.topics && userData.topics[topicName];

                    if (!topicExists) {
                        this.$root.toast = {
                            type: "error",
                            text: "Tópico não encontrado"
                        };
                        return;
                    }

                    delete userData.topics[topicName];
                    docRef
                        .update({
                            topics: userData.topics
                        })
                        .then(() => {
                            this.$root.toast = {
                                type: "success",
                                text: "Tópico excluído com sucesso"
                            };
                            this.selectedTopic = this.$root.selectedTopicName = null;
                            if (this.$router.history.current.fullPath != "/") this.$router.push("/");
                        })
                        .catch((error) => {
                            this.$root.toast = {
                                type: "error",
                                text: "Erro ao excluir tópico: " + error,
                            }
                        });
                })
                .catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter dados do usuário: " + error,
                    }
                });
        },
        deleteAllTopics() {
            if (!confirm("Tem certeza que deseja excluir TODOS os tópicos? Essa ação não poderá ser desfeita!")) return;

            const collectionRef = this.db.collection('tasks');
            collectionRef
                .get()
                .then(querySnapshot => {
                    querySnapshot.forEach((doc) => {
                        doc.ref.delete();
                        this.$root.toast = {
                            type: "success",
                            text: "Tópicos excluídos com sucesso"
                        };
                        this.selectedTopic = this.$root.selectedTopicName = null;
                    });
                })
                .catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Falha ao excluir tópicos:" + error
                    }
                });
        },
        
        addTask() {
            if (!this.addNewTaskName) {
                this.formTaskError = "Preencha o campo";
                return;
            }

            const {
                name
            } = this.selectedTopic;
            const docRef = this.db.collection('tasks').doc(this.user.uid);
            docRef
                .get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();

                        if (userData && userData.topics) {
                            const topic = userData.topics[name];

                            if (topic) {
                                const taskData = {
                                    id: Date.now().toString(36),
                                    name: String(this.addNewTaskName).replaceAll(".", ""),
                                    status: false,
                                    created_at: currentTime(),
                                    priority: this.addNewTaskPriority,
                                    comment: this.addNewTaskComment?.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'),
                                    delivery_date: this.addNewTaskDate,
                                };
                                const updatedTasks = [...topic.tasks, taskData];

                                docRef
                                    .update({
                                        [`topics.${name}.tasks`]: updatedTasks
                                    })
                                    .then(() => {
                                        this.$root.toast = {
                                            type: "success",
                                            text: "Tarefa adicionada com sucesso"
                                        };
                                        this.addNewTaskComment = this.addNewTaskDate = this.addNewTaskName = null;
                                        this.sortTasksByPriority();
                                        this.closeAddingTask();
                                    })
                                    .catch(error => {
                                        this.$root.toast = {
                                            type: "error",
                                            text: "Erro ao adicionar tarefa: " + error,
                                        };
                                    });
                            }
                        }
                    }
                })
                .catch(error => {
                    this.addNewTaskName = null;
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao carregar tópico: " + error,
                    };
                });
        },
        editTask() {
            if (!this.editNewTaskName) {
                this.editNewTaskNameError = "Preencha o campo";
            }

            if (!this.editNewTaskPriority) {
                this.editNewTaskPriorityError = "Preencha o campo";
            }

            if (!this.editNewTaskName || !this.editNewTaskPriority) return;

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef
                .get()
                .then((doc) => {
                    const selectedTopicData = doc.data().topics[this.selectedTopic.name];

                    if (selectedTopicData && selectedTopicData.tasks) {
                        const updatedTasks = selectedTopicData.tasks.map((task) => {
                            if (task.id == this.editTaskId) {
                                task.name = String(this.editNewTaskName).replaceAll(".", "");
                                task.priority = this.editNewTaskPriority;
                                task.delivery_date = this.editNewTaskDate;
                                task.comment = this.editNewTaskComment?.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
                            }

                            return task;
                        });

                        docRef
                            .update({
                                [`topics.${this.selectedTopic.name}.tasks`]: updatedTasks
                            })
                            .then(() => {
                                this.$root.toast = {
                                    type: "success",
                                    text: "Tarefa alterada com sucesso"
                                }

                                this.closeEditingTask();
                                this.searchTaskByName();
                            })
                            .catch((error) => {
                                this.$root.toast = {
                                    type: "error",
                                    text: "Erro ao alterar tarefa: " + error,
                                }
                            });
                    }
                }).catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter tarefa: " + error,
                    }
                });
        },
        changeTaskStatus(taskId) {
            const docRef = this.db.collection("tasks").doc(this.user.uid);

            docRef
                .get()
                .then((doc) => {
                    const selectedTopicData = doc.data().topics[this.selectedTopic.name];

                    if (selectedTopicData && selectedTopicData.tasks) {
                        const updatedTasks = selectedTopicData.tasks.map((task) => {
                            if (task.id == taskId) {
                                task.status = !task.status;
                            }
                            return task;
                        });
                        this.db
                            .collection("tasks")
                            .doc(this.user.uid)
                            .update({
                                [`topics.${this.selectedTopic.name}.tasks`]: updatedTasks
                            })
                            .then(() => {
                                this.$root.toast = {
                                    type: "success",
                                    text: "Status alterado com sucesso"
                                }
                                this.searchTaskByStatus();
                            }).catch((error) => {
                                this.$root.toast = {
                                    type: "error",
                                    text: "Erro ao alterar status da tarefa: " + error,
                                }
                            });
                    }
                })
                .catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter tarefa: " + error,
                    }
                });
        },
        deleteTask(topicName, taskId) {
            if (!confirm("Tem certeza que deseja excluir essa tarefa? Essa ação não poderá ser desfeita!")) return;

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef.get()
                .then((doc) => {
                    const userData = doc.data();
                    const topicExists = userData && userData.topics && userData.topics[topicName];

                    if (!topicExists) {
                        this.$root.toast = {
                            type: "error",
                            text: "Tópico não encontrado"
                        };
                        return;
                    }

                    const selectedTopic = userData.topics[topicName];
                    const updatedTasks = selectedTopic.tasks.filter(task => task.id !== taskId);

                    docRef.update({
                        [`topics.${topicName}.tasks`]: updatedTasks
                    })
                        .then(() => {
                            this.$root.toast = {
                                type: "success",
                                text: "Tarefa excluída com sucesso"
                            };
                            this.sortTasksByPriority();
                        })
                        .catch((error) => {
                            this.$root.toast = {
                                type: "error",
                                text: "Erro ao excluir tarefa: " + error
                            }
                        });
                })
                .catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter dados do usuário: " + error
                    }
                });
        },

        getPriorityClass(priority) {
            const classes = {
                [TASK_PRIORITIES.high]: "priority-high",
                [TASK_PRIORITIES.medium]: "priority-medium",
                [TASK_PRIORITIES.small]: "priority-small",
            };

            return classes[priority] ?? '';
        },
        sortTasksByPriority() {
            this.selectedTopic.tasks = this.selectedTopic.tasks.sort((taskA, taskB) => {
                const priorityA = taskA.priority;
                const priorityB = taskB.priority;

                if (priorityA == priorityB) return 0;
                if (priorityA == TASK_PRIORITIES.high || (priorityA == TASK_PRIORITIES.medium && priorityB == TASK_PRIORITIES.small)) return -1;
                return 1;
            });
        },
        searchTaskByName() {
            this.filterTask = "all";
            const searchTerm = this.searchTask.trim().toLowerCase();
            this.selectedTopic.tasks = this.defaultTasks.filter(task => task.name.toLowerCase().includes(searchTerm));
            this.sortTasksByPriority();
        },
        searchTaskByStatus() {
            this.searchTask = "";
            const selectedFilter = this.filterTask;

            if (selectedFilter == "all") {
                this.selectedTopic.tasks = this.defaultTasks;
            } else {
                const taskIsCompleted = selectedFilter == "completed";
                this.selectedTopic.tasks = this.defaultTasks.filter(task => task.status == taskIsCompleted);
            }

            this.sortTasksByPriority();
        },

        openEditTopic(name) {
            this.topicOldName = this.topicNewName = name;
            this.editingTopic = true;
        },
        closeEditingTopic() {
            this.editingTopic = false;
        },
        openAddTask(name) {
            this.topicOldName = this.topicNewName = name;
            this.addingTask = true;
        },
        closeAddingTask() {
            this.addNewTaskPriority = TASK_PRIORITIES.small;
            this.addingTask = false;
        },
        openTaskComment(comment) {
            this.selectedComment = comment.replace(/\n/g, '<br>');
            this.showingComment = true;
        },
        closeShowingComment() {
            this.showingComment = false;
        },
        openEditTask(task) {
            const { id, name, priority, delivery_date, comment } = task;
            this.editTaskId = id;
            this.editNewTaskName = name;
            this.editNewTaskPriority = priority;
            this.editNewTaskDate = delivery_date;
            this.editNewTaskComment = comment?.replace(/<a.*?href=['"](.*?)['"].*?>(.*?)<\/a>/g, '$2');
            this.editingTask = true;
        },
        closeEditingTask() {
            this.editingTask = false;
        },
        closeTopicsMenu() {
            this.$root.toggleTopicsMenu();
        },

        loadUserTopics() {
            if (!this.user) {
                this.$router.push("/login");
                return;
            }

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef.onSnapshot(
                (doc) => {
                    const userData = doc.data();
                    const topicsExists = userData && userData.topics && Object.keys(userData.topics).length > 0;

                    if (!topicsExists) {
                        this.topics = null;
                        return;
                    }

                    const topics = [];
                    Object.keys(userData.topics).forEach(topicName => {
                        const topic = userData.topics[topicName];
                        const topicObject = {
                            id: topic.id,
                            name: topic.name,
                            tasks: topic.tasks,
                            tasks_length: topic.tasks?.length ?? 0,
                            created_at: topic.created_at
                        }

                        topics.push(topicObject);
                    });
                    this.topics = topics.sort((a, b) => {
                        return new Date(a.created_at) - new Date(b.created_at);
                    });

                    if (this.$route.params.id) {
                        this.loadTopic(this.$route.params.id);
                    }
                },
                (error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter documento: " + error
                    };
                });

            this.loadedTopics = true;
        },
    },
    created() {
        document.title = PAGE_TITLES.home;
        this.$root.showBtn = true;
        this.loadUserTopics();

        document.addEventListener('keydown', ({ key }) => {
            if (key == 'Escape') {
                this.editingTopic && this.closeEditingTopic();
                this.editingTask && this.closeEditingTask();
                this.addingTask && this.closeAddingTask();
                this.showingComment && this.closeShowingComment();
            }
        });

        document.addEventListener("click", e => {
            const element = e.target;

            if (element.classList.contains("modal")) {
                this.editingTopic && this.closeEditingTopic();
                this.editingTask && this.closeEditingTask();
                this.addingTask && this.closeAddingTask();
                this.showingComment && this.closeShowingComment();
            }

            const dialog = element.querySelector(".modal-dialog");
            if (dialog) {
                dialog.addEventListener("click", e => e.stopPropagation());
            }
        });
    },
    watch: {
        "newTopic": function () {
            this.formTopicError = '';
        },
        "addNewTaskName": function () {
            this.formTaskError = '';
        },
        "topicNewName": function () {
            this.topicEditingError = '';
        },
        "editNewTaskName": function () {
            this.editNewTaskNameError = '';
        },
        "$route.params.id": function (id) {
            if (id) {
                this.loadTopic(id);
            } else {
                this.selectedTopic = this.$root.selectedTopicName = null;
            }

            this.filterTask = "all";
            this.searchTask = "";
        },
        "$root.isMenuTopicsActive": function (data) {
            this.isMenuTopicsActive = data;
        },
    }
}

export default Home;