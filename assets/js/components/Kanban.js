import { DOC_NAME, PAGE_TITLES, TASK_KANBAN_STATUSES } from "../utils/variables.js";
import { formatDate, getPriorityClass, getPriorityText, getPriorityIcon } from "../utils/functions.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
                this.tasks.todo = tasks.filter(task => task.kanbanStatus === TASK_KANBAN_STATUSES.todo || !task.kanbanStatus);
                this.tasks.doing = tasks.filter(task => task.kanbanStatus === TASK_KANBAN_STATUSES.doing);
                this.tasks.completed = tasks.filter(task => task.kanbanStatus === TASK_KANBAN_STATUSES.completed);
            } catch (error) {
                this.$root.showToast("error", `Erro ao resgatar tarefas": ${error.message}`);
            } finally {
                this.loadedTasks = true;
            }
        },

        getUserTasks(topics) {
            return Object.values(topics)
                .filter(topic => topic.tasks?.length > 0)
                .flatMap(topic => topic.tasks.map(task => this.createTaskObject(topic, task)));
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
        
            if (this.draggedTask.kanbanStatus !== column) {
                this.changeTaskColumn(this.draggedTask, column);
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
        
        handleTouchStart(event, task) {
            this.draggedTask = task;
            const touch = event.touches[0];
            event.target.classList.add("dragging");
            this.startX = touch.clientX;
            this.startY = touch.clientY;
        
            // Definindo um tempo limite para diferenciar entre um toque e um arrastar
            this.touchTimer = setTimeout(() => {
                // Se o usuário ainda estiver pressionando após um pequeno atraso, inicie o arrastar
                this.isDragging = true;
            }, 200);
        },
        
        handleTouchMove(event) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.startX;
            const deltaY = touch.clientY - this.startY;
        
            // Se a movimentação for maior que um determinado limite, considere como um arrastar
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                event.preventDefault(); // Evita a ação padrão
            }
        },
        
        handleTouchEnd(event) {
            clearTimeout(this.touchTimer); // Limpa o timer
        
            if (!this.draggedTask) return;
        
            if (this.isDragging) {
                const column = this.getDropColumn(event);
                if (column) {
                    this.onDrop(column);
                }
            }
        
            event.target.classList.remove("dragging");
            this.draggedTask = null;
            this.isDragging = false; // Reseta o estado de arrasto
        },
        
        getDropColumn(event) {
            const touch = event.changedTouches[0];
            const columnElements = document.querySelectorAll('.kanban__column');
        
            for (const column of columnElements) {
                const rect = column.getBoundingClientRect();
        
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    return column.getAttribute('data-status');
                }
            }
        
            return null;
        },
        
        changeTaskColumn(task, newColumn) {
            task.kanbanStatus = newColumn;
            this.tasks.todo = this.tasks.todo.filter(t => t !== task);
            this.tasks.doing = this.tasks.doing.filter(t => t !== task);
            this.tasks.completed = this.tasks.completed.filter(t => t !== task);
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
                    const selectedTopicData = Object.values(userData.topics).find(topic => topic.id === selectedTopicId);
                    const selectedTopicName = selectedTopicData.name;

                    if (selectedTopicData && selectedTopicData.tasks) {
                        taskToUpdate.kanbanStatus = newKanbanStatus;
                        taskToUpdate.status = newKanbanStatus === TASK_KANBAN_STATUSES.completed;

                        const updatedTasks = selectedTopicData.tasks.map(task => {
                            if (taskToUpdate.id == task.id) {
                                return {
                                    ...task,
                                    kanbanStatus: newKanbanStatus,
                                    status: newKanbanStatus === TASK_KANBAN_STATUSES.completed
                                };
                            }

                            return task;
                        });

                        await updateDoc(docRef, { [`topics.${selectedTopicName}.${DOC_NAME}`]: updatedTasks });
                    }
                }
            } catch (error) {
                this.$root.showToast("error", `Erro ao atualizar status da tarefa: ${error.message}`);
            }
        }
    },

    mounted() {
        document.title = PAGE_TITLES.kanban;
        Object.assign(this.$root, { showBtn: false });
        this.getAllUserTasks();
    },
};

export default Kanban;
