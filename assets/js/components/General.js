import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { DOC_NAME, PAGE_TITLES, TASK_PRIORITIES } from "../utils/variables.js";
import {
    formatDate,
    getPriorityClass,
    getPriorityText,
    getPriorityIcon,
} from "../utils/functions.js";

const General = {
    template: "#general-page",
    props: ["db"],
    data() {
        return {
            allUserTasks: [],
            loadedTasks: false,
            priorityCount: null,
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

        downloadAsPDF() {
            const container = document.getElementById("pdf-container");

            html2canvas(container)
                .then((canvas) => {
                    const imgData = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = imgData;
                    link.download = `${Date.now()}.png`;

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })
                .catch((error) => {
                    this.$root.showToast("error", "Error capturing the container: " + error);
                });
        },

        focusTasksByPriority(priority) {
            this.allUserTasks.forEach((task) => {
                task.isHovering = true;
                task.isFocused =
                    task.priority == priority ||
                    (priority == TASK_PRIORITIES.completed && task.status);
            });
        },

        removeFocusFromTasks() {
            this.allUserTasks.forEach((task) => {
                task.isHovering = false;
                task.isFocused = false;
            });
        },

        formatComment(comment) {
            return marked.parse(comment, {
                gfm: true,
                breaks: true,
            });
        },

        createTaskObject({ name, id }, task) {
            return {
                topic_name: name,
                topic_id: id,
                ...task,
                isHovering: false,
                isFocused: false,
            };
        },

        updatePriorityCounter() {
            this.priorityCount = {
                completed: this.allUserTasks.filter((task) => task.status).length,
                high: this.allUserTasks.filter((task) => task.priority === TASK_PRIORITIES.high)
                    .length,
                medium: this.allUserTasks.filter((task) => task.priority === TASK_PRIORITIES.medium)
                    .length,
                small: this.allUserTasks.filter((task) => task.priority === TASK_PRIORITIES.small)
                    .length,
            };
        },

        async fetchUserTasks() {
            try {
                const docRef = doc(this.db, DOC_NAME, this.$root.user.uid);
                const docSnap = await getDoc(docRef);
                const userData = docSnap.data();

                if (!userData?.topics || Object.keys(userData.topics).length === 0) {
                    this.loadedTasks = true;
                    return;
                }

                this.allUserTasks = this.getUserTasks(userData.topics);

                this.updatePriorityCounter();
            } catch (error) {
                this.$root.showToast("error", `Erro ao obter tarefas: ${error}`);
            } finally {
                this.loadedTasks = true;
            }
        },

        getUserTasks(topics) {
            return Object.values(topics)
                .filter((topic) => topic.tasks?.length > 0)
                .flatMap((topic) => topic.tasks.map((task) => this.createTaskObject(topic, task)))
                .sort((taskA, taskB) => {
                    if (taskA.status !== taskB.status) return taskA.status ? -1 : 1;
                    return taskB.priority - taskA.priority;
                });
        },
    },

    mounted() {
        document.title = PAGE_TITLES.general;
        Object.assign(this.$root, { showBtn: false });

        this.fetchUserTasks();
    },
};

export default General;
