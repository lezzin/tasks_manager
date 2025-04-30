import { doc, getDoc, updateDoc } from "firebase/firestore";

import { db } from "../libs/firebase";

import { useAuthStore } from "../stores/authStore";
import { PRINCIPAL_DOC_NAME, TASK_KANBAN_STATUSES } from "../utils/variables";

import { filterField } from "../utils/stringUtils";
import { currentTime } from "../utils/dateUtils";

import { useTopic } from "./useTopic";

const { user } = useAuthStore();

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

const checkUserTasks = async () => {
    let hasAnyTask = false;

    try {
        const docRef = doc(db, PRINCIPAL_DOC_NAME, user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            hasAnyTask = false;
            return hasAnyTask;
        }

        const userData = docSnap.data();
        hasAnyTask = userData.tasks && Object.entries(userData.tasks).length > 0;
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        hasAnyTask = false;
    }

    return hasAnyTask;
};

const getUserTasks = async (userId) => {
    try {
        const docRef = doc(db, PRINCIPAL_DOC_NAME, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) throwValidationError("Documento não encontrado.", "doc-not-found");

        const userData = docSnap.data();
        return userData.tasks ? { ...userData.tasks } : {};
    } catch (error) {
        throw error;
    }
};

const getUserTasksByTopic = async (topicId, userId) => {
    const tasks = await getUserTasks(userId);
    return Object.values(tasks).filter((task) => task.topicId === topicId);
};

const getUserTasksWithTopic = async (userId) => {
    const data = await getUserTasks(userId);
    const userTasks = Object.values(data);
    const { getTopicInfo } = useTopic();

    await Promise.all(
        userTasks.map(async (task) => {
            const { name } = await getTopicInfo(task.topicId, userId);
            task.topicName = name;
        })
    );

    return userTasks;
};

const updateTasks = async (userId, tasks) => {
    const docRef = doc(db, PRINCIPAL_DOC_NAME, userId);
    await updateDoc(docRef, { tasks });
};

const addTask = async (topicId, newName, comment, priority, deliveryDate, userId) => {
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
        topicId: topicId,
    };

    const allTasks = await getUserTasks(userId);
    const updatedTasks = { ...allTasks, [newTask.id]: newTask };
    await updateTasks(userId, updatedTasks);
};

const editTask = async (
    taskToUpdate,
    newName,
    newComment,
    newPriority,
    newDeliveryDate,
    userId
) => {
    validateTaskName(newName);
    validateDeliveryDate(newDeliveryDate);

    const updatedTask = {
        ...taskToUpdate,
        name: filterField(newName),
        priority: newPriority,
        delivery_date: newDeliveryDate,
        comment: String(newComment).trim() ?? "",
    };

    const allTasks = await getUserTasks(userId);
    const updatedTasks = { ...allTasks, [updatedTask.id]: updatedTask };
    await updateTasks(userId, updatedTasks);
};

const changeStatus = async (taskToUpdate, userId) => {
    const newStatus = !taskToUpdate.status;
    const updatedTask = {
        ...taskToUpdate,
        status: newStatus,
        kanbanStatus: newStatus ? TASK_KANBAN_STATUSES.completed : TASK_KANBAN_STATUSES.todo,
    };

    const allTasks = await getUserTasks(userId);
    const updatedTasks = { ...allTasks, [updatedTask.id]: updatedTask };
    await updateTasks(userId, updatedTasks);

    return newStatus;
};

const changeKanbanStatus = async (taskToUpdate, newKanbanStatus, userId) => {
    const updatedTask = {
        ...taskToUpdate,
        kanbanStatus: newKanbanStatus,
        status: newKanbanStatus === TASK_KANBAN_STATUSES.completed,
    };

    const allTasks = await getUserTasks(userId);
    const updatedTasks = { ...allTasks, [updatedTask.id]: updatedTask };
    await updateTasks(userId, updatedTasks);
};

const deleteTask = async (taskToDelete, userId) => {
    const allTasks = await getUserTasks(userId);

    const { [taskToDelete.id]: _, ...remainingTasks } = allTasks;
    await updateTasks(userId, remainingTasks);
};

export const useTask = () => {
    return {
        changeKanbanStatus,
        changeStatus,
        getUserTasks,
        deleteTask,
        addTask,
        editTask,
        getUserTasksByTopic,
        getUserTasksWithTopic,
        checkUserTasks,
    };
};
