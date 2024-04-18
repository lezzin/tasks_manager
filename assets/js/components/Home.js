import {
    PAGE_TITLES,
    TASK_PRIORITIES,
    currentTime
} from "../utils.js";

const Home = {
    template: "#home-page",
    props: ["db", "auth"],
    data() {
        return {
            user: this.$root.user,
            isMobile: this.$root.isMobile,
            isMenuTopicsActive: this.$root.isMenuTopicsActive,

            topics: null,
            selectedTopic: null,
            loadedTopics: false,

            newTopic: '',
            formTopicError: '',

            formTaskError: '',
            newTask: '',
            isListening: false,
            recognition: null,

            topicOldName: null,
            topicNewName: '',
            topicEditingError: '',
            editingTopic: false,

            taskEditingId: null,
            taskNewDescription: '',
            taskNewDescriptionError: '',
            taskNewPriority: '',
            taskNewPriorityError: '',
            editingTask: false,

            defaultTasks: [],
            searchTask: "",
            searckTaskError: '',
            filterTask: 'all',
        }
    },
    methods: {
        getPriorityClass(priority) {
            const classes = {
                [TASK_PRIORITIES.high]: "priority-high",
                [TASK_PRIORITIES.medium]: "priority-medium",
                [TASK_PRIORITIES.small]: "priority-small",
            };

            return classes[priority] ?? '';
        },
        getPriorityText(priority) {
            const classes = {
                [TASK_PRIORITIES.high]: "Alta prioridade",
                [TASK_PRIORITIES.medium]: "Média prioridade",
                [TASK_PRIORITIES.small]: "Baixa prioridade",
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
        openEditTopic(name) {
            this.topicOldName = name;
            this.topicNewName = name;
            this.editingTopic = true;
        },
        closeEditingTopic() {
            this.topicOldName = this.topicNewName = null;
            this.editingTopic = false;
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
        toggleSpeechRecognition() {
            if (!this.isListening) {
                this.startSpeechRecognition();
            } else {
                this.stopSpeechRecognition();
            }
        },
        startSpeechRecognition() {
            this.isListening = true;
            this.recognition = new window.webkitSpeechRecognition();
            this.recognition.lang = 'pt-BR';
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                this.newTask = result;
                this.stopSpeechRecognition();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
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
        addTask() {
            if (!this.newTask) {
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
                                    name: String(this.newTask).replaceAll(".", ""),
                                    status: false,
                                    priority: TASK_PRIORITIES.small,
                                    created_at: currentTime(),
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
                                        this.newTask = '';
                                        this.sortTasksByPriority();
                                    })
                                    .catch(error => {
                                        console.error("Error updating tasks:", error);
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
                    console.error("Error loading topic: ", error);
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao carregar tópico: " + error,
                    };
                });
        },
        openEditTask(id, description, priority) {
            this.taskEditingId = id;
            this.taskNewDescription = description;
            this.taskNewPriority = priority;
            this.editingTask = true;
        },
        closeEditingTask() {
            this.taskEditingId = this.taskNewDescription = this.taskNewPriority = null;
            this.editingTask = false;
        },
        editTask() {
            if (!this.taskNewDescription) {
                this.taskNewDescriptionError = "Preencha o campo";
            }

            if (!this.taskNewPriority) {
                this.taskNewPriorityError = "Preencha o campo";
            }

            if (!this.taskNewDescription || !this.taskNewPriority) return;

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef
                .get()
                .then((doc) => {
                    const selectedTopicData = doc.data().topics[this.selectedTopic.name];

                    if (selectedTopicData && selectedTopicData.tasks) {
                        const updatedTasks = selectedTopicData.tasks.map((task) => {
                            if (task.id == this.taskEditingId) {
                                task.name = String(this.taskNewDescription).replaceAll(".", "");
                                task.priority = this.taskNewPriority;
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
                        return new Date(b.created_at) - new Date(a.created_at);
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

            addEventListener('keydown', ({
                key
            }) => {
                if (key == 'Escape') {
                    this.closeEditingTopic();
                    this.closeEditingTask();
                }
            });

            this.loadedTopics = true;
        }
    },
    created() {
        document.title = PAGE_TITLES.home;
        this.$root.showBtn = true;
        this.loadUserTopics();
    },
    watch: {
        "newTopic": function () {
            this.formTopicError = '';
        },
        "newTask": function () {
            this.formTaskError = '';
        },
        "topicNewName": function () {
            this.topicEditingError = '';
        },
        "taskNewDescription": function () {
            this.taskNewDescriptionError = '';
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
        "$root.isMobile": function (data) {
            this.isMobile = data;
        },
    }
}

export default Home;