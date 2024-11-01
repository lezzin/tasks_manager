import { DOC_NAME, PAGE_TITLES, TASK_KANBAN_STATUSES } from "../utils/variables.js";
import {
    formatDate,
    getPriorityClass,
    getPriorityText,
    getPriorityIcon,
} from "../utils/functions.js";
import {
    doc,
    getDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const Kanban = {
    template: "#kanban-page",
    props: ["db"],
    data() {
        return {
            tasks: {
                todo: [],
                doing: [],
                completed: [],
            },
            draggedTask: null,
            activeColumn: null,
            tasksLength: 0,
            loadedTasks: false,
            lastClickTime: 0,
            doubleClickDelay: 300,
        };
    },
    methods: {
        formatDate,
        getPriorityClass,
        getPriorityText,
        getPriorityIcon,

        sendBack() {
            this.$router.back();
        },

        createTaskObject({ name, id }, task) {
            return {
                topic_name: name,
                topic_id: id,
                ...task,
            };
        },

        async getAllUserTasks() {
            try {
                const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
                const docSnap = await getDoc(docRef);
                const userData = docSnap.data();

                if (!userData?.topics || Object.keys(userData.topics).length === 0) {
                    this.loadedTasks = true;
                    return;
                }

                const tasks = this.getUserTasks(userData.topics);

                this.tasksLength = tasks.length;
                this.tasks.todo = tasks.filter(
                    (task) => task.kanbanStatus === TASK_KANBAN_STATUSES.todo || !task.kanbanStatus
                );
                this.tasks.doing = tasks.filter(
                    (task) => task.kanbanStatus === TASK_KANBAN_STATUSES.doing
                );
                this.tasks.completed = tasks.filter(
                    (task) => task.kanbanStatus === TASK_KANBAN_STATUSES.completed
                );
            } catch (error) {
                this.$root.showToast("error", `Erro ao resgatar tarefas: ${error.message}`);
            } finally {
                this.loadedTasks = true;
            }
        },

        getUserTasks(topics) {
            return Object.values(topics)
                .filter((topic) => topic.tasks?.length > 0)
                .flatMap((topic) => topic.tasks.map((task) => this.createTaskObject(topic, task)));
        },

        handleDragEvents(event, action, task = null) {
            if (action === "start") {
                this.draggedTask = task;
                event.target.classList.add("dragging");
                return;
            }

            if (action === "end") {
                event.target.classList.remove("dragging");
                this.draggedTask = null;
            }
        },

        onDrop(column) {
            if (!this.draggedTask) return;

            if (typeof this.draggedTask === "object" && this.draggedTask !== null) {
                if (this.draggedTask.kanbanStatus !== column) {
                    this.changeTaskColumn(this.draggedTask, column);
                }
            } else {
                console.error("Dragged task is not a valid object:", this.draggedTask);
            }

            this.draggedTask = null;
            this.activeColumn = null;
        },

        onDragEnter(event, kanbanStatus) {
            if (this.activeColumn !== kanbanStatus) {
                this.activeColumn = kanbanStatus;
            }
            event.preventDefault();
        },

        onDragOver(event) {
            event.preventDefault();
        },

        moveTask(task, direction) {
            const currentColumn = task.kanbanStatus;
            let newColumn;

            if (direction === "prev") {
                newColumn = this.getPreviousColumn(currentColumn);
            } else if (direction === "next") {
                newColumn = this.getNextColumn(currentColumn);
            }

            if (newColumn) {
                this.changeTaskColumn(task, newColumn);
            }
        },

        getPreviousColumn(currentColumn) {
            const columns = ["todo", "doing", "completed"];
            const currentIndex = columns.indexOf(currentColumn);
            return currentIndex > 0 ? columns[currentIndex - 1] : null;
        },

        getNextColumn(currentColumn) {
            const columns = ["todo", "doing", "completed"];
            const currentIndex = columns.indexOf(currentColumn);
            return currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;
        },

        isFirstColumn(currentColumn) {
            return currentColumn === "todo";
        },

        isLastColumn(currentColumn) {
            return currentColumn === "completed";
        },

        changeTaskColumn(task, newColumn) {
            task.kanbanStatus = newColumn;
            this.tasks.todo = this.tasks.todo.filter((t) => t !== task);
            this.tasks.doing = this.tasks.doing.filter((t) => t !== task);
            this.tasks.completed = this.tasks.completed.filter((t) => t !== task);
            this.tasks[newColumn].push(task);
            this.updateTaskStatus(task, newColumn);
        },

        async updateTaskStatus(taskToUpdate, newKanbanStatus) {
            try {
                const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
                const docSnap = await getDoc(docRef);
                const userData = docSnap.exists() ? docSnap.data() : null;

                if (userData && userData.topics) {
                    const selectedTopicId = taskToUpdate.topic_id;
                    const selectedTopicData = Object.values(userData.topics).find(
                        (topic) => topic.id === selectedTopicId
                    );
                    const selectedTopicName = selectedTopicData.name;

                    if (selectedTopicData && selectedTopicData.tasks) {
                        taskToUpdate.kanbanStatus = newKanbanStatus;
                        taskToUpdate.status = newKanbanStatus === TASK_KANBAN_STATUSES.completed;

                        const updatedTasks = selectedTopicData.tasks.map((task) => {
                            if (taskToUpdate.id == task.id) {
                                return {
                                    ...task,
                                    kanbanStatus: newKanbanStatus,
                                    status: newKanbanStatus === TASK_KANBAN_STATUSES.completed,
                                };
                            }

                            return task;
                        });

                        await updateDoc(docRef, {
                            [`topics.${selectedTopicName}.${DOC_NAME}`]: updatedTasks,
                        });
                    }
                }
            } catch (error) {
                this.$root.showToast(
                    "error",
                    `Erro ao atualizar status da tarefa: ${error.message}`
                );
            }
        },
    },

    mounted() {
        document.title = PAGE_TITLES.kanban;
        Object.assign(this.$root, { showBtn: false });
        this.getAllUserTasks();
    },
};

export default Kanban;
