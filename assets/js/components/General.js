import { TASK_PRIORITIES, formatDate, PAGE_TITLES } from "../utils.js";

const General = {
    template: "#general-page",
    props: ["db"],
    data() {
        return {
            user: this.$root.user,
            allUserTasks: [],
            loadedTasks: false,
            priorityCount: null,
        };
    },
    methods: {
        handleFocusOnTaskByPriority(priority) {
            this.allUserTasks.forEach(task => {
                task.isHovering = true;
                if (task.priority == priority || (priority == 'completed' && task.status)) {
                    task.isFocused = true;
                }
            });
        },
        handleRemoveFocus() {
            this.allUserTasks.forEach(task => {
                task.isHovering = false;
                task.isFocused = false;
            });
        },
        formatDate(date) {
            return formatDate(date);
        },
        formatComment(comment) {
            return comment.replace(/\n/g, '<br>');
        },
        getPriorityClass(priority) {
            return {
                [TASK_PRIORITIES.high]: "priority-high",
                [TASK_PRIORITIES.medium]: "priority-medium",
                [TASK_PRIORITIES.small]: "priority-small",
            }[priority] ?? '';
        },
        getPriorityText(priority) {
            return {
                [TASK_PRIORITIES.high]: "Alta prioridade",
                [TASK_PRIORITIES.medium]: "Média prioridade",
                [TASK_PRIORITIES.small]: "Baixa prioridade",
            }[priority] ?? '';
        },
        createTaskObject(topic, task) {
            const { name, id } = topic;
            return {
                topic_name: name,
                topic_id: id,
                ...task,
                isHovering: false,
                isFocused: false
            };
        },
        createPriorityCounter() {
            const priorityCounts = {
                completed: this.allUserTasks.filter(task => task.status).length,
                high: this.allUserTasks.filter(task => task.priority == TASK_PRIORITIES.high).length,
                medium: this.allUserTasks.filter(task => task.priority == TASK_PRIORITIES.medium).length,
                small: this.allUserTasks.filter(task => task.priority == TASK_PRIORITIES.small).length,
            };
            this.priorityCount = priorityCounts;
        },
        async getAllUserTasks() {
            try {
                const docRef = this.db.collection("tasks").doc(this.user.uid);
                const doc = await docRef.get();
                const userData = doc.data();

                if (!userData || !userData.topics || Object.keys(userData.topics).length === 0) {
                    this.loadedTasks = true;
                    return;
                }

                const tasks = [];
                for (const topic of Object.values(userData.topics)) {
                    if (topic.tasks && topic.tasks.length > 0) {
                        tasks.push(...topic.tasks.map(task => this.createTaskObject(topic, task)));
                    }
                }

                tasks.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                this.allUserTasks = tasks;
                this.createPriorityCounter();
                this.loadedTasks = true;
            } catch (error) {
                console.error("Error retrieving document:", error);
                this.$root.toast = {
                    type: "error",
                    text: "Erro ao obter documento: " + error,
                };
                this.loadedTasks = true;
            }
        }
    },
    created() {
        document.title = PAGE_TITLES.general;
        this.$root.selectedTopicName = null;
        this.$root.showBtn = false;
        this.$root.toggleTopicsMenu();

        if (this.user) {
            this.getAllUserTasks();
        } else {
            this.$router.push("/login");
        }
    },
};

export default General;
