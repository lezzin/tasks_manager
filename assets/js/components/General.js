const TASK_PRIORITIES = {
    high: 3,
    medium: 2,
    small: 1
}

const General = {
    template: "#general-page",
    props: ["db"],
    data() {
        return {
            user: this.$root.user,
            allUserTasks: null,
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
        createTaskObject(topicId, task) {
            return {
                topicId: topicId,
                name: task.name,
                status: task.status,
                priority: task.priority,
                created_at: task.created_at
            };
        },
        getAllUserTasks() {
            this.db.collection("tasks").doc(this.user.uid)
                .onSnapshot(
                    (doc) => {
                        const userData = doc.data();
                        const userTopicsExists = userData && userData.topics && Object.keys(userData.topics).length > 0;

                        if (!userTopicsExists) return;

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

                        tasks.sort((a, b) => { return new Date(a.created_at) - new Date(b.created_at); });
                        this.allUserTasks = tasks;
                    },
                    (error) => {
                        this.$root.toast = {
                            type: "error",
                            text: "Erro ao obter documento: " + error
                        };
                    });
        },
    },
    created() {
        document.title = "TaskFlow | Calendário";
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