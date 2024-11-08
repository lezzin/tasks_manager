import { DOC_NAME, TASK_KANBAN_STATUSES } from "../utils/variables";
import { filterField } from "../utils/stringUtils";
import { currentTime } from "../utils/dateUtils";
import { db } from "../libs/firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";

const throwValidationError = (message, code) => {
    const error = new Error(message);
    error.code = code;
    throw error;
};

const validateTaskName = (name) => {
    if (!name) {
        throwValidationError("Preencha o campo", "empty-name");
    }
};

const validateDeliveryDate = (date) => {
    if (date) {
        const taskDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate < today) {
            throwValidationError("Insira uma data futura ou atual.", "invalid-date");
        }
    }
};

const extractUniqueTasks = (userTopics) =>
    Object.values(userTopics)
        .filter(topic => topic.tasks?.length > 0)
        .flatMap(topic => topic.tasks || []);

const getUserTasks = async (userId) => {
    try {
        const docRef = doc(db, DOC_NAME, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) throw new Error("Documento não encontrado");

        const userData = docSnap.data();
        if (!userData.topics || Object.keys(userData.topics).length === 0)
            throw new Error("Tópico não encontrado");

        return extractUniqueTasks(userData.topics);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getTopicByName = async (name, userId) => {
    const docRef = doc(db, DOC_NAME, userId);
    const docSnap = await getDoc(docRef);
    const userData = docSnap.data();

    return userData?.topics?.[name];
}

const updateTasks = async (userId, topicName, tasks) => {
    const docRef = doc(db, DOC_NAME, userId);
    await updateDoc(docRef, { [`topics.${topicName}.tasks`]: tasks });
};

const addTask = async (topic, newName, comment, priority, deliveryDate, userId) => {
    validateTaskName(newName);
    validateDeliveryDate(deliveryDate);

    const newTask = {
        id: Date.now().toString(36),
        name: filterField(newName),
        status: false,
        created_at: currentTime(),
        priority,
        comment: String(comment).trim() ?? "",
        delivery_date: deliveryDate,
        kanbanStatus: TASK_KANBAN_STATUSES.todo,
        topic: { id: topic.id, name: topic.name },
    };

    const updatedTasks = [...topic.tasks, newTask];
    await updateTasks(userId, topic.name, updatedTasks);
};

const editTask = async (taskToUpdate, newName, newComment, newPriority, newDeliveryDate, userId) => {
    validateTaskName(newName);
    validateDeliveryDate(newDeliveryDate);

    const updatedTask = {
        ...taskToUpdate,
        name: filterField(newName),
        priority: newPriority,
        delivery_date: newDeliveryDate,
        comment: String(newComment).trim() ?? "",
    };

    const userTasks = await getUserTasks(userId);
    const updatedTasks = userTasks.map(task => task.id === taskToUpdate.id ? updatedTask : task);
    await updateTasks(userId, taskToUpdate.topic.name, updatedTasks);
};

const changeStatus = async (taskToUpdate, userId) => {
    const { tasks } = await getTopicByName(taskToUpdate.topic.name, userId);

    const newStatus = !taskToUpdate.status;
    const updatedTask = {
        ...taskToUpdate,
        status: newStatus,
        kanbanStatus: newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo,
    };

    const updatedTasks = tasks.map(task => task.id === taskToUpdate.id ? updatedTask : task);
    await updateTasks(userId, taskToUpdate.topic.name, updatedTasks);

    return newStatus;
};

const changeKanbanStatus = async (taskToUpdate, newKanbanStatus, userId) => {
    const updatedTask = {
        ...taskToUpdate,
        kanbanStatus: newKanbanStatus,
        status: (newKanbanStatus === TASK_KANBAN_STATUSES.completed),
    };

    const userTasks = await getUserTasks(userId);
    const updatedTasks = userTasks.map(task => task.id === taskToUpdate.id ? updatedTask : task);
    await updateTasks(userId, taskToUpdate.topic.name, updatedTasks);
};

const deleteTask = async (allTasks, taskToDelete, userId) => {
    const updatedTasks = allTasks.filter(task => task.id !== taskToDelete.id);
    await updateTasks(userId, taskToDelete.topic.name, updatedTasks);
};

export const useTask = () => {
    return {
        changeKanbanStatus,
        changeStatus,
        getUserTasks,
        deleteTask,
        addTask,
        editTask,
    };
};
