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
Com base na lista de tarefas anteriores abaixo, sugira uma nova tarefa que seja relevante para o contexto atual. Considere o tópico, status, nome e prioridade das tarefas ao fazer a sugestão. 
O resultado deve ser um JSON estruturado com os campos especificados, e cada campo deve conter informações detalhadas e relevantes.

Responda no formato JSON com os seguintes campos:
- "task": Nome claro e direto da nova tarefa sugerida
- "subtasks": Uma lista de no máximo três subtarefas alternativas relacionadas à tarefa principal
- "justification": Justificativa objetiva de por que esta tarefa foi sugerida, baseada nas tarefas e padrões anteriores
- "details": Descrição detalhada da tarefa em Markdown, incluindo subtarefas, se aplicável, ou links úteis caso existam

Exemplo de resposta JSON:
{
    "task": "Organizar Reunião de Equipe",
    "subtasks": ["Agendar horário", "Convidar participantes", "Preparar agenda"],
    "justification": "Com base nas tarefas anteriores relacionadas ao planejamento de eventos, sugerimos organizar uma reunião de equipe para alinhar o andamento dos projetos."
    "details": "Conversar com cada um dos participantes através do Whatsapp e enviar o link de convite (https://link.com)"
}

Abaixo está a lista das tarefas anteriores para contexto:
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
    if (tasks.length < 2) {
        return { error: "Insira ao menos 2 tarefas." };
    }

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
