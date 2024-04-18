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
            topics: null,
            isMobile: this.$root.isMobile,
            isMenuTopicsActive: this.$root.isMenuTopicsActive,
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
        loadUserTopics() {
            this.db.collection("tasks").doc(this.user.uid)
                .onSnapshot((doc) => {
                    const userData = doc.data();

                    if (userData && userData.topics && Object.keys(userData.topics).length > 0) {
                        this.topics = userData.topics;
                    } else {
                        this.topics = null;
                    }
                }, (error) => {
                    this.$root.toast = {
                        type: "error",
                        text: "Erro ao obter documento: " + error
                    };
                });
        }
    },
    created() {
        document.title = "TaskFlow | Calendário";
        this.$root.selectedTopicName = null;

        if (this.user) {
            this.loadUserTopics();
        }
    },
    watch: {
        "$root.isMenuTopicsActive": function (data) {
            this.isMenuTopicsActive = data;
        },
        "$root.isMobile": function (data) {
            this.isMobile = data;
        },
        "$root.user": function (user) {
            if (user) {
                this.user = user;
                this.loadUserTopics();
            } else {
                this.$router.push("/login");
            }
        }
    }
}

export default General;