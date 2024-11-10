import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { getPriorityText } from "../utils/priorityUtils";
import { db } from "../libs/firebase";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const usageLimit = 10;

const parseResponse = (response) => {
    try {
        const cleanedResponse = String(response)
            .replace(/```json/g, '')
            .replace(/```/g, '');

        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("Erro ao parsear a resposta:", error);
        return null;
    }
};

const buildTaskDetails = (tasks) => {
    return tasks.map((task, index) => (
        `Tarefa ${index + 1}: ${task.name} 
        Criada em: ${task.created_at}
        Tópico: ${task.topicName ?? "Não especificado"}
        Status: ${task.status ? "Concluída" : "Não concluída"}
        Prioridade: ${getPriorityText(task.priority)}\n`
    )).join("\n");
};

const createPrompt = (taskDetails) => {
    return `Dada a lista de tarefas anteriores abaixo, sugira uma nova tarefa relacionada que seja relevante para o contexto atual. 
A sugestão deve considerar o tópico, status e prioridade das tarefas anteriores. 
Responda no formato JSON com os seguintes campos:
- "task": Nome da nova tarefa sugerida
- "subtasks": Lista de tarefas relacionadas (não precisam estar relacionadas à tarefa principal, mas com o contexto do tópico e tarefas anteriores)
- "justification": Justificativa breve explicando por que a tarefa foi sugerida, com base nas tarefas anteriores.
- "details": Detalhes relacionados à tarefa (linguagem Markdown)

Exemplo de resposta JSON:
{
    "task": "Organizar Reunião de Equipe",
    "subtasks": ["Agendar horário", "Convidar participantes", "Preparar agenda"],
    "justification": "Com base nas tarefas anteriores relacionadas ao planejamento de eventos, sugerimos organizar uma reunião de equipe para alinhar o andamento dos projetos."
    "details": "Conversar com cada um dos participantes através do Whatsapp e enviar o link de convite (https://link.com)"
}

Tarefas anteriores:
${taskDetails}`;
};

const checkUsageLimit = async (uid) => {
    const userDocRef = doc(db, "ai_usage", uid);
    const userDoc = await getDoc(userDocRef);
    const currentDate = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD

    if (!userDoc.exists()) {
        await setDoc(userDocRef, { count: 1, lastUsed: currentDate });
        return usageLimit - 1;
    }

    const { count, lastUsed } = userDoc.data();

    if (lastUsed !== currentDate) {
        await setDoc(userDocRef, { count: 1, lastUsed: currentDate });
        return usageLimit - 1;
    }

    const remaining = usageLimit - count;

    if (remaining <= 0) {
        throw new Error("Limite de uso atingido.");
    }

    await updateDoc(userDocRef, { count: increment(1) });
    return remaining - 1;
};

const suggestTask = async (tasks, userId) => {
    try {
        const usageRemaining = await checkUsageLimit(userId);

        const taskDetails = buildTaskDetails(tasks);
        const prompt = createPrompt(taskDetails);

        const result = await model.generateContent(prompt);
        const data = result.response.text();
        const parsedResponse = parseResponse(data);

        return { ...parsedResponse, usageRemaining };
    } catch (error) {
        return { error: error.message, usageRemaining: 0 };
    }
};

export const useGemini = () => {
    return {
        suggestTask
    };
};
