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
        formatComment(comment) {
            return comment.replace(/\n/g, '<br>')
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
        createTaskObject(topic, task) {
            const { name, id } = topic;
            return {
                topic_name: name,
                topic_id: id,
                ...task
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
                    if (topic.tasks && topic.tasks.length > 0) {
                        for (const task of topic.tasks) {
                            const taskObject = this.createTaskObject(topic, task);
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
