import { DOC_NAME, TASK_KANBAN_STATUSES } from "../utils/variables";
import { db } from "../libs/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref } from "vue";

const extractUniqueTasks = (userTopics) => {
    return (
        Object.values(userTopics)
            .filter((topic) => topic.tasks?.length > 0)
            .flatMap(topic => topic.tasks || [])
    );
};

const getUserTasks = async (userId) => {
    try {
        const tasks = ref([]);
        const docRef = doc(db, DOC_NAME, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            const error = new Error("Documento não encontrado");
            error.code = "doc-not-found";
            throw error;
        }

        const userData = docSnap.data();
        const topicsExists = userData && userData.topics && Object.keys(userData.topics).length > 0;

        if (!topicsExists) {
            const error = new Error("Tópico não encontrado");
            error.code = "topic-not-found";
            throw error;
        }

        tasks.value = extractUniqueTasks(userData.topics);
        return tasks.value;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const changeStatus = async (allTasks, taskToUpdate, userId) => {
    try {
        if (!taskToUpdate || !Array.isArray(allTasks) || !userId) {
            throw new Error("Dados inválidos para atualização");
        }

        const docRef = doc(db, DOC_NAME, userId);
        const topicName = taskToUpdate.topic?.name;

        if (!topicName) {
            throw new Error("Nome do tópico não encontrado na tarefa");
        }

        const newStatus = !taskToUpdate.status;
        const updatedTask = {
            ...taskToUpdate,
            status: newStatus,
            kanbanStatus: newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo
        };

        const updatedTasks = allTasks.map((task) => task.id === taskToUpdate.id ? updatedTask : task);

        await updateDoc(docRef, { [`topics.${topicName}.${DOC_NAME}`]: updatedTasks });

        return newStatus;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const changeKanbanStatus = async (taskToUpdate, newKanbanStatus, userId) => {
    try {
        const userTasks = await getUserTasks(userId);
        const docRef = doc(db, DOC_NAME, userId);

        const updatedTask = {
            ...taskToUpdate,
            kanbanStatus: newKanbanStatus,
            status: (newKanbanStatus === TASK_KANBAN_STATUSES.completed)
        }

        const updatedTasks = userTasks.map((task) => taskToUpdate.id === task.id ? updatedTask : task);

        await updateDoc(docRef, { [`topics.${taskToUpdate.topic.name}.${DOC_NAME}`]: updatedTasks });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const deleteTask = async (allTasks, taskToDelete, userId) => {
    try {
        const docRef = doc(db, DOC_NAME, userId);
        const updatedTasks = allTasks.filter((task) => task.id !== taskToDelete.id);
        const topicName = taskToDelete.topic.name;

        await updateDoc(docRef, { [`topics.${topicName}.${DOC_NAME}`]: updatedTasks });
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const useTask = () => {
    return {
        changeKanbanStatus,
        changeStatus,
        getUserTasks,
        deleteTask,
    };
};
