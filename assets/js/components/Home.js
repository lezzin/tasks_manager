import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { DOC_NAME, PAGE_TITLES, TASK_KANBAN_STATUSES, TASK_PRIORITIES } from "../utils/variables.js";
import { formatDate, currentTime, filterField, getPriorityClass, getPriorityText, getPriorityIcon } from "../utils/functions.js";

const Home = {
    template: "#home-page",
    props: ["db", "auth"],
    data() {
        return {
            isMenuTopicsActive: this.$root.isMenuTopicsActive,

            topics: null,
            selectedTopic: null,
            loadedTopics: false,

            newTopic: '',
            formTopicError: '',

            addingTask: false,
            formTaskError: '',
            addNewTaskName: '',
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
            editNewTaskDate: '',
            editingTask: false,

            defaultTasks: [],
            searchTask: "",
            filterTask: 'all',

            selectedComment: null,
            showingComment: false,

            commentMd: {
                add: null,
                edit: null
            }
        }
    },
    methods: {
        formatDate,
        getPriorityClass,
        getPriorityText,
        getPriorityIcon,

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
            this.selectedTopic = null;

            if (!id) {
                document.title = PAGE_TITLES.home.default;
                return;
            }

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
            document.title = PAGE_TITLES.home.topic(topic.name);

            this.sortTasksByPriority();
        },

        async addTopic() {
            this.formTopicError = '';

            if (!this.newTopic) {
                this.formTopicError = "Preencha o campo";
                return;
            }

            const formattedTopicName = filterField(this.newTopic);

            if (formattedTopicName.length <= 3) {
                this.formTopicError = "Insira pelo menos 4 letras!";
                return;
            }

            const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
            const userData = await this.getUserData(docRef);

            if (userData && userData.topics && userData.topics[formattedTopicName]) {
                this.formTopicError = "Esse tópico já existe";
                return;
            }

            await setDoc(docRef, {}, { merge: true });
            await updateDoc(docRef, {
                [`topics.${formattedTopicName}`]: {
                    id: Date.now().toString(26),
                    name: formattedTopicName,
                    tasks: [],
                    created_at: currentTime(),
                }
            });

            this.$root.showToast("success", "Tópico criado com sucesso");

            this.newTopic = '';
        },

        async editTopic() {
            this.topicEditingError = "";

            if (!this.topicNewName) {
                this.topicEditingError = "Preencha o campo de edição";
                return;
            }

            const formattedTopicName = filterField(this.topicNewName);

            if (formattedTopicName.length <= 3) {
                this.topicEditingError = "Insira pelo menos 4 letras!";
                return;
            }

            const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
            const userData = await this.getUserData(docRef);

            if (userData && userData.topics && userData.topics[this.topicOldName]) {
                const selectedTopicData = userData.topics[this.topicOldName];
                if (formattedTopicName == this.topicOldName) {
                    this.closeEditingTopic();
                    return;
                };

                if (userData.topics[formattedTopicName]) {
                    this.topicEditingError = "Esse tópico já existe";
                    return;
                }

                const updatedTopics = {
                    ...userData.topics,
                    [formattedTopicName]: {
                        ...selectedTopicData,
                        name: formattedTopicName
                    },
                };
                delete updatedTopics[this.topicOldName];

                await updateDoc(docRef, { topics: updatedTopics });
                this.closeEditingTopic();
                this.$root.showToast("success", "Tópico atualizado com sucesso");
            } else {
                this.topicEditingError = "Tópico não encontrado";
            }
        },

        async deleteTopic(topicName) {
            if (!confirm("Tem certeza que deseja excluir esse tópico? Essa ação não poderá ser desfeita!")) return;

            const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
            const userData = await this.getUserData(docRef);

            if (!userData || !userData.topics || !userData.topics[topicName]) {
                this.$root.showToast("error", "Tópico não encontrado");
                return;
            }

            delete userData.topics[topicName];
            await updateDoc(docRef, { topics: userData.topics });
            this.$root.showToast("success", "Tópico excluído com sucesso");
            this.selectedTopic = null;
            if (this.$router.history.current.fullPath !== "/") this.$router.push("/");
        },

        async deleteAllTopics() {
            if (!confirm("Tem certeza que deseja excluir TODOS os seus tópicos? Essa ação não poderá ser desfeita!")) return;

            const docRef = doc(this.db, 'tasks', this.$root.user.uid);
            const userData = await this.getUserData(docRef);

            if (!userData || !userData.topics || Object.keys(userData.topics).length === 0) {
                this.$root.showToast("error", "Nenhum tópico encontrado para excluir.");
                return;
            }

            await updateDoc(docRef, { topics: {} });
            this.$root.showToast("success", "Todos os tópicos foram excluídos com sucesso.");
            this.selectedTopic = null;
        },

        async addTask() {
            if (!this.addNewTaskName) {
                this.formTaskError = "Preencha o campo";
                return;
            }

            const { name, id } = this.selectedTopic;
            const docRef = doc(this.db, 'tasks', this.$root.user.uid);
            const userData = await this.getUserData(docRef);

            if (userData && userData.topics) {
                const topic = userData.topics[name];
                const sanitizedComment = this.commentMd.add.value() ?? "";

                if (topic) {
                    const taskData = {
                        id: Date.now().toString(36),
                        name: filterField(this.addNewTaskName),
                        status: false,
                        created_at: currentTime(),
                        priority: this.addNewTaskPriority,
                        comment: sanitizedComment,
                        delivery_date: this.addNewTaskDate,
                        kanbanStatus: "todo",
                        topic_id: id
                    };
                    const updatedTasks = [...topic.tasks, taskData];

                    await updateDoc(docRef, { [`topics.${name}.${DOC_NAME}`]: updatedTasks });
                    this.$root.showToast("success", "Tarefa adicionada com sucesso");
                    this.addNewTaskComment = this.addNewTaskDate = this.addNewTaskName = null;
                    this.sortTasksByPriority();
                    this.closeAddingTask();
                }
            }
        },

        async editTask() {
            if (!this.editNewTaskName || !this.editNewTaskPriority) {
                if (!this.editNewTaskName) this.editNewTaskNameError = "Preencha o campo";
                if (!this.editNewTaskPriority) this.editNewTaskPriorityError = "Preencha o campo";
                return;
            }

            const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
            const selectedTopicData = (await getDoc(docRef)).data().topics[this.selectedTopic.name];
            const sanitizedComment = this.commentMd.edit.value() ?? "";

            if (selectedTopicData && selectedTopicData.tasks) {
                const updatedTasks = selectedTopicData.tasks.map(task => {
                    if (task.id == this.editTaskId) {
                        return {
                            ...task,
                            name: filterField(this.editNewTaskName),
                            priority: this.editNewTaskPriority,
                            delivery_date: this.editNewTaskDate,
                            comment: sanitizedComment
                        };
                    }
                    return task;
                });

                await updateDoc(docRef, { [`topics.${this.selectedTopic.name}.${DOC_NAME}`]: updatedTasks });
                this.$root.showToast("success", "Tarefa alterada com sucesso");
                this.closeEditingTask();
                this.searchTaskByName();
            }
        },

        async changeTaskStatus(taskId) {
            const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
            const userData = await this.getUserData(docRef);

            if (userData && userData.topics) {
                const selectedTopicData = userData.topics[this.selectedTopic.name];

                if (selectedTopicData && selectedTopicData.tasks) {
                    const updatedTasks = selectedTopicData.tasks.map(task => {
                        const newStatus = !task.status;

                        if (task.id == taskId) {
                            return {
                                ...task,
                                status: newStatus,
                                kanbanStatus: newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo
                            };
                        }
                        return task;
                    });

                    await updateDoc(docRef, { [`topics.${this.selectedTopic.name}.${DOC_NAME}`]: updatedTasks });
                    this.$root.showToast("success", "Status de conclusão alterado com sucesso");
                    this.searchTaskByStatus();
                }
            }
        },

        async deleteTask(topicName, taskId) {
            if (!confirm("Tem certeza que deseja excluir essa tarefa? Essa ação não poderá ser desfeita!")) return;

            const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
            const userData = await this.getUserData(docRef);

            if (!userData || !userData.topics || !userData.topics[topicName]) {
                this.$root.showToast("error", "Tópico não encontrado");
                return;
            }

            const selectedTopic = userData.topics[topicName];
            const updatedTasks = selectedTopic.tasks.filter(task => task.id !== taskId);

            await updateDoc(docRef, { [`topics.${topicName}.${DOC_NAME}`]: updatedTasks });
            this.$root.showToast("success", "Tarefa excluída com sucesso");
            this.sortTasksByPriority();
        },

        async getUserData(docRef) {
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        },

        sortTasksByPriority() {
            this.selectedTopic.tasks = this.selectedTopic.tasks.sort((taskA, taskB) => {
                const priorityA = taskA.priority;
                const priorityB = taskB.priority;
                const statusA = taskA.status;
                const statusB = taskB.status;

                if (statusA !== statusB) {
                    return statusA ? -1 : 1;
                }

                if (priorityA !== priorityB) {
                    return priorityB - priorityA;
                }

                return 0;
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
                const taskIsCompleted = selectedFilter == TASK_PRIORITIES.completed;
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
            this.showingComment = true;
            this.selectedComment = marked.parse(comment, {
                gfm: true,
                breaks: true
            });
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
            this.commentMd.edit.value(comment);
            this.editingTask = true;
        },
        closeEditingTask() {
            this.editingTask = false;
        },
        closeTopicsMenu() {
            this.$root.isMenuTopicsActive = false;
        },

        loadUserTopics() {
            const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);

            onSnapshot(docRef, (doc) => {
                const userData = doc.data();
                const topicsExists = userData && userData.topics && Object.keys(userData.topics).length > 0;

                if (!topicsExists) {
                    this.topics = null;
                    return;
                }

                this.topics = Object.keys(userData.topics).map(topicName => {
                    const topic = userData.topics[topicName];
                    return {
                        id: topic.id,
                        name: topic.name,
                        tasks: topic.tasks,
                        tasks_length: topic.tasks?.length ?? 0,
                        created_at: topic.created_at
                    };
                }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                if (this.$route.params.id) {
                    this.loadTopic(this.$route.params.id);
                } else {
                    document.title = PAGE_TITLES.home.default;
                }
            }, (error) => {
                if (!this.$root.user) return;

                this.$root.showToast("error", "Erro ao obter documento: " + error.message);
            });

            this.loadedTopics = true;
        },

        initializeMarkdownEditors() {
            this.destroyMarkdownEditors();

            this.commentMd.edit = new SimpleMDE({
                element: document.querySelector("#edit-task-comment"),
                spellChecker: false
            });

            this.commentMd.add = new SimpleMDE({
                element: document.querySelector("#add-task-comment"),
                spellChecker: false
            });
        },
        destroyMarkdownEditors() {
            if (this.commentMd.add) {
                this.commentMd.add.toTextArea();
                this.commentMd.add = null;
            }

            if (this.commentMd.edit) {
                this.commentMd.edit.toTextArea();
                this.commentMd.edit = null;
            }
        },
    },
    mounted() {
        this.$root.showBtn = true;

        this.loadUserTopics();
        this.initializeMarkdownEditors();

        document.addEventListener('keydown', ({ key }) => {
            const events = {
                'Escape': () => {
                    this.editingTopic && this.closeEditingTopic();
                    this.editingTask && this.closeEditingTask();
                    this.addingTask && this.closeAddingTask();
                    this.showingComment && this.closeShowingComment();
                    this.$root.isMenuTopicsActive && this.closeTopicsMenu();
                }
            }

            events[key] && events[key]();
        });

        document.addEventListener("click", e => {
            const element = e.target;

            if (element.classList.contains("modal")) {
                this.editingTopic && this.closeEditingTopic();
                this.editingTask && this.closeEditingTask();
                this.addingTask && this.closeAddingTask();
                this.showingComment && this.closeShowingComment();
            }

            if (
                !element.closest('.home-aside') &&
                !element.closest('.btn--mobile') &&
                this.$root.isMenuTopicsActive
            ) {
                this.closeTopicsMenu();
            }

            if (element.geta.contains("btn--mobile") || element.classList.contains("modal__dialog")) {
                e.stopPropagation();
            }
        });
    },
    watch: {
        newTopic: function () {
            this.formTopicError = '';
        },
        addNewTaskName: function () {
            this.formTaskError = '';
        },
        topicNewName: function () {
            this.topicEditingError = '';
        },
        editNewTaskName: function () {
            this.editNewTaskNameError = '';
        },
        "$route.params.id": function (id) {
            this.loadTopic(id);

            this.filterTask = "all";
            this.searchTask = "";
        },
        "$root.isMenuTopicsActive": function (data) {
            this.isMenuTopicsActive = data;
        },
    }
}

export default Home;
