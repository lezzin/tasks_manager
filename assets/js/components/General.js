import { TASK_PRIORITIES, formatDate, PAGE_TITLES } from "../utils.js";

const General = {
    template: "#general-page",
    props: ["db"],
    data() {
        return {
            user: this.$root.user,
            allUserTasks: [],
            loadedTasks: false,
        }
    },
    methods: {
        formatDate(date) {
            return formatDate(date)
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
            const classes = {
                [TASK_PRIORITIES.high]: "Alta prioridade",
                [TASK_PRIORITIES.medium]: "Média prioridade",
                [TASK_PRIORITIES.small]: "Baixa prioridade",
            };

            return classes[priority] ?? '';
        },
        createTaskObject(topicId, task) {
            return {
                topicId: topicId,
                name: task.name,
                status: task.status,
                priority: task.priority,
                created_at: task.created_at,
                delivery_date: task.delivery_date,
            };
        },
        getAllUserTasks() {
            const docRef = this.db.collection("tasks").doc(this.user.uid);
            docRef
                .get()
                .then((doc) => {
                    const userData = doc.data();
                    const userTopicsExists = userData && userData.topics && Object.keys(userData.topics).length > 0;

                    if (!userTopicsExists) {
                        this.loadedTasks = true;
                        return;
                    };

                    const tasks = [];

                    Object.values(userData.topics).forEach(topic => {
                        const topicId = topic.id;

                        if (topic.tasks && topic.tasks.length > 0) {
                            topic.tasks.forEach(task => {
                                const taskObject = this.createTaskObject(topicId, task);
                                tasks.push(taskObject);
                            });
                        }
                    });

                    tasks.sort((a, b) => {
                        return new Date(a.created_at) - new Date(b.created_at);
                    });
                    this.allUserTasks = tasks;
                    this.loadedTasks = true;
                })
                .catch(error => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter documento: " + error
                    }
                    this.loadedTasks = true;
                });
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
}

export default General;