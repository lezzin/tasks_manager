import { PRINCIPAL_DOC_NAME, TOPIC_MAX_LENGTH, TOPIC_MIN_LENGTH } from "../utils/variables";
import { currentTime } from "../utils/dateUtils";
import { filterField } from "../utils/stringUtils";
import { db } from "../libs/firebase";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { useTask } from "./useTask";

const getUserData = async (docRef) => {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

const throwValidationError = (message, code) => {
    const error = new Error(message);
    error.code = code;
    throw error;
};

const validateTopicName = (name) => {
    if (!name) throwValidationError("Preencha o campo", "name");
    if (name.length < TOPIC_MIN_LENGTH)
        throwValidationError(`Insira pelo menos ${TOPIC_MIN_LENGTH} letras!`, "name");
    if (name.length > TOPIC_MAX_LENGTH)
        throwValidationError(
            `Você atingiu o limite de caracteres! (${name.length} de ${TOPIC_MAX_LENGTH})`,
            "name"
        );
};

const getTopicInfo = async (topicId, userId) => {
    const docRef = doc(db, PRINCIPAL_DOC_NAME, userId);
    const userData = await getUserData(docRef);

    return userData?.topics[topicId] || {};
};

const addTopic = async (name, userId) => {
    const formattedTopicName = filterField(name);
    validateTopicName(formattedTopicName);

    const docRef = doc(db, PRINCIPAL_DOC_NAME, userId);
    const userData = await getUserData(docRef);

    const existingTopic = Object.values(userData?.topics || {}).find(
        (topic) => topic.name === formattedTopicName
    );
    if (existingTopic) throwValidationError("Esse tópico já existe", "name");

    const uniqueId = Date.now().toString(26);

    await setDoc(docRef, {}, { merge: true });
    await updateDoc(docRef, {
        [`topics.${uniqueId}`]: {
            id: uniqueId,
            name: formattedTopicName,
            created_at: currentTime(),
        },
    });
};

const editTopic = async (newName, oldName, userId) => {
    const formattedTopicName = filterField(newName);
    validateTopicName(formattedTopicName);

    if (formattedTopicName === oldName) throwValidationError("Nome igual ao antigo.", "same-name");

    const docRef = doc(db, PRINCIPAL_DOC_NAME, userId);
    const userData = await getUserData(docRef);

    const topicId = Object.keys(userData.topics).find((id) => userData.topics[id].name === oldName);
    if (!topicId) throwValidationError("Tópico antigo não encontrado", "not-found");

    await updateDoc(docRef, {
        [`topics.${topicId}.name`]: formattedTopicName,
    });
};

const deleteTopic = async (topicId, userId) => {
    const docRef = doc(db, PRINCIPAL_DOC_NAME, userId);
    const userData = await getUserData(docRef);

    if (!userData || !userData.topics || !userData.topics[topicId])
        throwValidationError("Tópico não encontrado.", "not-found");

    const { getUserTasks } = useTask();
    const tasks = await getUserTasks(userId);

    const updatedTasks = Object.values(tasks).filter((task) => task.topicId !== topicId);

    delete userData.topics[topicId];

    await updateDoc(docRef, {
        topics: userData.topics,
        tasks: updatedTasks.reduce((acc, task) => ({ ...acc, [task.id]: task }), {}),
    });
};

const deleteAllTopics = async (userId) => {
    const docRef = doc(db, PRINCIPAL_DOC_NAME, userId);
    const userData = await getUserData(docRef);

    if (!userData || !userData.topics || Object.keys(userData.topics).length === 0)
        throwValidationError("Nenhum tópico encontrado para excluir.", "not-found");

    await updateDoc(docRef, { topics: {}, tasks: {} });
};

export const useTopic = () => ({
    addTopic,
    editTopic,
    deleteTopic,
    deleteAllTopics,
    getTopicInfo,
});
