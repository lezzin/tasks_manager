import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { getPriorityText } from "../utils/priorityUtils";
import { db } from "../libs/firebase";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const usageLimit = 10;

const parseResponse = (response) => {
    try {
        return JSON.parse(response.replace(/```json|```/g, ''));
    } catch (error) {
        console.error("Erro ao parsear a resposta:", error);
        return { error: "Erro ao processar a resposta da IA" };
    }
};

const buildTaskDetails = (tasks) =>
    tasks.map(({ name, created_at, topicName, status, priority }, index) => (
        `Tarefa ${index + 1}: ${name} 
        Criada em: ${created_at}
        Tópico: ${topicName ?? "Não especificado"}
        Status: ${status ? "Concluída" : "Não concluída"}
        Prioridade: ${getPriorityText(priority)}\n`
    )).join("\n");

const createPrompt = (taskDetails) => `
Dada a lista de tarefas anteriores abaixo, sugira uma nova tarefa relacionada que seja relevante para o contexto atual. 
A sugestão deve considerar o tópico, status e prioridade das tarefas anteriores. 
Responda no formato JSON com os seguintes campos:
- "task": Nome da nova tarefa sugerida
- "subtasks": Lista de tarefas relacionadas
- "justification": Justificativa breve
- "details": Detalhes da tarefa (Markdown)

Tarefas anteriores:
${taskDetails}`;

const getUsageCount = async (uid) => {
    const userDocRef = doc(db, "ai_usage", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        await setDoc(userDocRef, { count: 0, lastUsed: new Date().toISOString().split('T')[0] });
        return usageLimit;
    }

    const { count, lastUsed } = userDoc.data();
    const today = new Date().toISOString().split('T')[0];

    if (lastUsed !== today) {
        await setDoc(userDocRef, { count: 0, lastUsed: today });
        return usageLimit;
    }

    return usageLimit - count;
};

const checkUsageLimit = async (uid) => {
    const remaining = await getUsageCount(uid);
    if (remaining <= 0) throw new Error("Limite de uso atingido.");

    await updateDoc(doc(db, "ai_usage", uid), { count: increment(1) });
};

const suggestTask = async (tasks, userId) => {
    try {
        await checkUsageLimit(userId);

        const taskDetails = buildTaskDetails(tasks);
        const prompt = createPrompt(taskDetails);

        const result = await model.generateContent(prompt);
        return parseResponse(result.response.text());
    } catch (error) {
        return { error: error.message };
    }
};

export const useGemini = () => ({ suggestTask, getUsageCount });
