import { getUserTasks } from "@/actions/task.action";
import TasksClient from "./tasks-client";

export default async function TasksPage() {
    const tasks = await getUserTasks();

    return <TasksClient initialTasks={tasks} />;
}