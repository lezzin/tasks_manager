import { TASK_PRIORITIES, formatDate, PAGE_TITLES } from "../utils.js";

const General = {
    template: "#general-page",
    props: ["db"],
    data() {
        return {
            user: this.$root.user,
            allUserTasks: [],
            loadedTasks: false,
        };
    },
    methods: {
        formatDate(date) {
            return formatDate(date);
        },
        getPriorityClass(priority) {
            const classes = {
                [TASK_PRIORITIES.high]: "priority-high",
                [TASK_PRIORITIES.medium]: "priority-medium",
                [TASK_PRIORITIES.small]: "priority-small",
            };
            return classes[priority] ?? '';
        },
        getPriorityText(priority) {
            const priorityTexts = {
                [TASK_PRIORITIES.high]: "Alta prioridade",
                [TASK_PRIORITIES.medium]: "Média prioridade",
                [TASK_PRIORITIES.small]: "Baixa prioridade",
            };
            return priorityTexts[priority] ?? '';
        },
        createTaskObject(topicId, task) {
            return {
                topicId,
                name: task.name,
                status: task.status,
                priority: task.priority,
                created_at: task.created_at,
                delivery_date: task.delivery_date,
            };
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
                    const topicId = topic.id;
                    if (topic.tasks && topic.tasks.length > 0) {
                        for (const task of topic.tasks) {
                            const taskObject = this.createTaskObject(topicId, task);
                            tasks.push(taskObject);
                        }
                    }
                }

                tasks.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                this.allUserTasks = tasks;
                this.loadedTasks = true;
            } catch (error) {
                this.$root.toast = {
                    type: "error",
                    text: "Erro ao obter documento: " + error,
                };
                this.loadedTasks = true;
            }
        },
    },
    created() {
        document.title = PAGE_TITLES.general;
        this.$root.selectedTopicName = null;
        this.$root.showBtn = false;

        if (this.user) {
            this.getAllUserTasks();
        } else {
            this.$router.push("/login");
        }
    },
};

export default General;
