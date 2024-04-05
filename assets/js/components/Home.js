function currentTime() {
    return new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

const Home = {
    template: "#home-page",
    props: ["db", "auth"],
    data() {
        return {
            user: this.$root.user,
            topics: null,
            selectedTopic: null,
            isMobile: this.$root.isMobile,
            isMenuTopicsActive: this.$root.isMenuTopicsActive,

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
            taskEditingError: '',
            editingTask: false,

            defaultTasks: [],
            searckTaskError: '',
            filterTask: 'all',
        }
    },
    methods: {
        loadTopic(id) {
            this.selectedTopic = this.$root.selectedTopicName = null;

            if (!this.topics) {
                if (this.$router.history.current.fullPath != "/") this.$router.push("/");
                return;
            }

            const topicsArray = Object.values(this.topics);
            const topic = topicsArray.find(topic => topic.id == id);

            if (!topic) {
                if (this.$router.history.current.fullPath != "/") this.$router.push("/");
                return;
            }

            this.selectedTopic = topic;
            this.selectedTopic.tasks_length = this.selectedTopic?.tasks.length;
            this.defaultTasks = topic.tasks;
            this.$root.selectedTopicName = topic.name;
        },
        addTopic() {
            this.formTopicError = '';

            if (!this.newTopic) {
                this.formTopicError = "Preencha o campo"
                return;
            }

            if (String(this.newTopic.replaceAll(".", "").length <= 3)) {
                this.formTopicError = "Insira pelo menos 4 letras!";
                return;
            }

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef.get().then((doc) => {
                const userData = doc.data();

                if (userData && userData.topics && userData.topics[this.newTopic]) {
                    this.formTopicError = "Esse tópico já existe";
                    return;
                }

                docRef.set({}, {
                    merge: true
                })
                    .then(() => {
                        return docRef.update({
                            [`topics.${this.newTopic}`]: {
                                id: Date.now().toString(26),
                                name: this.newTopic.replaceAll(".", ""),
                                tasks: []
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

            const tasksRef = this.db.collection("tasks").doc(this.user.uid);

            tasksRef.get().then((doc) => {
                const userData = doc.data();
                if (userData && userData.topics && userData.topics[this.topicOldName]) {
                    const selectedTopicData = userData.topics[this.topicOldName];
                    if (this.topicNewName === this.topicOldName) {
                        selectedTopicData.name = this.topicNewName;
                        return tasksRef.update({
                            [`topics.${this.topicOldName}.name`]: this.topicNewName
                        });
                    } else {
                        if (userData.topics[this.topicNewName]) {
                            this.topicEditingError = "Esse tópico já existe";
                            return Promise.reject("Tópico já existe");
                        } else {
                            const updatedTopics = {
                                ...userData.topics
                            };
                            updatedTopics[this.topicNewName] = selectedTopicData;
                            updatedTopics[this.topicNewName].name = this.topicNewName;
                            delete updatedTopics[this.topicOldName];
                            return tasksRef.update({
                                topics: updatedTopics
                            });
                        }
                    }
                } else {
                    this.topicEditingError = "Tópico não encontrado";
                    return Promise.reject("Tópico não encontrado");
                }
            }).then(() => {
                this.closeEditingTopic();
                this.$root.toast = {
                    type: "success",
                    text: "Tópico atualizado com sucesso"
                };
            }).catch((error) => {
                this.$root.toast = {
                    type: "error",
                    text: "Erro ao alterar tópico: " + error
                };
            });
        },
        deleteTopic(topicName) {
            if (!confirm("Tem certeza que deseja excluir esse tópico? Essa ação não poderá ser desfeita!")) return;

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef.get().then((doc) => {
                const userData = doc.data();

                if (userData && userData.topics && userData.topics[topicName]) {
                    delete userData.topics[topicName];
                    docRef.update({
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
                } else {
                    this.$root.toast = {
                        type: "error",
                        text: "Tópico não encontrado"
                    };
                }
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

            this.db.collection("tasks").get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    doc.ref.delete();
                    this.$root.toast = {
                        type: "success",
                        text: "Tópicos excluídos com sucesso"
                    };
                    this.selectedTopic = this.$root.selectedTopicName = null;
                });
            }).catch((error) => {
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
            docRef.get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData && userData.topics) {
                        const topic = userData.topics[name];

                        if (topic) {
                            const taskData = {
                                id: Date.now().toString(36),
                                name: this.newTask.replaceAll(".", ""),
                                status: false,
                                created_at: currentTime(),
                            };
                            const updatedTasks = [...topic.tasks, taskData];
                            this.db.collection('tasks').doc(this.user.uid).update({
                                [`topics.${name}.tasks`]: updatedTasks
                            }).then(() => {
                                this.$root.toast = {
                                    type: "success",
                                    text: "Tarefa adicionada com sucesso"
                                };
                                this.newTask = '';
                            }).catch(error => {
                                console.error("Error updating tasks:", error);
                                this.$root.toast = {
                                    type: "error",
                                    text: "Erro ao adicionar tarefa: " + error,
                                };
                            });
                        }
                    }
                }
            }).catch(error => {
                console.error("Error loading topic: ", error);
                this.$root.toast = {
                    type: "error",
                    text: "Erro ao carregar tópico: " + error,
                };
            });
        },
        openEditTask(id, description) {
            this.taskEditingId = id;
            this.taskNewDescription = description;
            this.editingTask = true;
        },
        closeEditingTask() {
            this.taskEditingId = this.taskNewDescription = null;
            this.editingTask = false;
        },
        editTask() {
            if (!this.taskNewDescription) {
                this.taskEditingError = "Preencha o campo";
                return;
            }
            this.db.collection("tasks").doc(this.user.uid).get().then((doc) => {
                const selectedTopicData = doc.data().topics[this.selectedTopic.name];

                if (selectedTopicData && selectedTopicData.tasks) {
                    const updatedTasks = selectedTopicData.tasks.map((task) => {
                        if (task.id == this.taskEditingId) {
                            task.name = this.taskNewDescription.replaceAll(".", "");
                        }

                        return task;
                    });
                    this.db.collection("tasks").doc(this.user.uid).update({
                        [`topics.${this.selectedTopic.name}.tasks`]: updatedTasks
                    }).then(() => {
                        this.$root.toast = {
                            type: "success",
                            text: "Tarefa alterada com sucesso"
                        }

                        this.closeEditingTask();
                        this.searchTaskByName();
                    }).catch((error) => {
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
            this.db.collection("tasks").doc(this.user.uid).get().then((doc) => {
                const selectedTopicData = doc.data().topics[this.selectedTopic.name];

                if (selectedTopicData && selectedTopicData.tasks) {
                    const updatedTasks = selectedTopicData.tasks.map((task) => {
                        if (task.id === taskId) {
                            task.status = !task.status;
                        }

                        return task;
                    });
                    this.db.collection("tasks").doc(this.user.uid).update({
                        [`topics.${this.selectedTopic.name}.tasks`]: updatedTasks
                    }).then(() => {
                        this.$root.toast = {
                            type: "success",
                            text: "Status alterado com sucesso"
                        }
                        this.searchTaskByStatus();
                    }).catch((error) => {
                        this.$root.toast = {
                            type: "errccr",
                            text: "Erro ao alterar status da tarefa: " + error,
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
        deleteTask(topicName, taskId) {
            if (!confirm("Tem certeza que deseja excluir essa tarefa? Essa ação não poderá ser desfeita!")) return;

            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef.get().then((doc) => {
                const userData = doc.data();

                if (userData && userData.topics && userData.topics[topicName]) {
                    const updatedTasks = userData.topics[topicName].tasks.filter(task => task.id !== taskId);
                    userData.topics[topicName].tasks = updatedTasks;

                    docRef.update({
                        [`topics.${topicName}.tasks`]: updatedTasks
                    })
                        .then(() => {
                            this.$root.toast = {
                                type: "success",
                                text: "Tarefa excluída com sucesso"
                            };
                        })
                        .catch((error) => {
                            this.$root.toast = {
                                type: "error",
                                text: "Erro ao excluir tarefa: " + error,
                            }
                        });
                } else {
                    this.$root.toast = {
                        type: "error",
                        text: "Tópico não encontrado"
                    };
                }
            })
                .catch((error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter dados do usuário: " + error,
                    }
                });
        },
        searchTaskByName() {
            this.filterTask = "all";
            const searchTerm = this.searchTask.trim().toLowerCase();

            if (searchTerm) {
                this.selectedTopic.tasks = this.defaultTasks.filter(task => task.name.toLowerCase().includes(searchTerm));
            } else {
                this.selectedTopic.tasks = this.defaultTasks;
            }
        },
        searchTaskByStatus() {
            this.searchTask = "";
            const selectedFilter = this.filterTask;
            if (selectedFilter === "all") {
                this.selectedTopic.tasks = this.defaultTasks;
            } else {
                const statusFilter = selectedFilter === "completed";
                this.selectedTopic.tasks = this.defaultTasks.filter(task => task.status === statusFilter);
            }
        },
    },
    created() {
        if (!this.user) {
            this.$router.push("/login");
            return;
        }

        document.title = "TaskFlow | Suas tarefas";

        this.db.collection("tasks").doc(this.user.uid)
            .onSnapshot((doc) => {
                const userData = doc.data();

                if (userData && userData.topics && Object.keys(userData.topics).length > 0) {
                    Object.keys(userData.topics).forEach(topicName => {
                        const topic = userData.topics[topicName];
                        topic.tasks_length = topic.tasks.length;
                    });
                    this.topics = userData.topics;
                    if (this.$route.params.id) {
                        this.loadTopic(this.$route.params.id);
                    }
                } else {
                    this.topics = null;
                }
            }, (error) => {
                this.$root.toast = {
                    type: "error",
                    text: "Erro ao obter documento: " + error
                };
            });

        addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeEditingTopic();
                this.closeEditingTask();
            }
        });
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
