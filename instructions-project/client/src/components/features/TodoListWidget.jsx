import React from "react";
import { Card, CardBody, Checkbox, cn, Input, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { todosAPI } from "../../services/todos";
import { useTranslation } from "react-i18next";

export function TodoListWidget() {
  const { t } = useTranslation();
  const [tasks, setTasks] = React.useState([]);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const loadTasks = async () => {
    try {
      const data = await todosAPI.getAll();
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (e) => {
    if (e.key === "Enter" && newTaskTitle.trim()) {
      try {
        setCreating(true);
        const newTask = await todosAPI.create({ title: newTaskTitle });
        setTasks([newTask, ...tasks]);
        setNewTaskTitle("");
      } catch (error) {
        console.error("Failed to create task:", error);
      } finally {
        setCreating(false);
      }
    }
  };

  const toggleTask = async (id, currentStatus) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !currentStatus } : t));
    
    try {
      await todosAPI.update(id, { isCompleted: !currentStatus });
    } catch (error) {
      console.error("Failed to update task:", error);
      // Revert on error
      setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: currentStatus } : t));
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <Card className="h-full bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md shadow-lg rounded-3xl">
      <CardBody className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">To-do list</h3>
            <p className="text-xs text-zinc-500 font-medium">{today}</p>
          </div>
          <div className="bg-primary-500/10 p-2 rounded-xl">
             <Icon icon="lucide:check-square" className="text-primary text-xl" />
          </div>
        </div>

        <div className="mb-4 relative">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onValueChange={setNewTaskTitle}
            onKeyDown={handleCreateTask}
            isDisabled={creating}
            classNames={{
              input: "text-sm",
              inputWrapper: "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 focus-within:bg-zinc-800 h-10 rounded-xl",
            }}
            startContent={
              creating ? <Spinner size="sm" color="current" /> : <Icon icon="lucide:plus" className="text-zinc-400" />
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner size="md" color="primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No tasks yet. Add one above!
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 border border-transparent",
                  task.isCompleted 
                    ? "bg-zinc-800/20" 
                    : "bg-white/5 hover:bg-white/10 hover:border-white/5 hover:shadow-sm"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <Checkbox 
                    isSelected={task.isCompleted} 
                    onValueChange={() => toggleTask(task.id, task.isCompleted)}
                    color="success"
                    radius="full"
                    size="lg"
                    classNames={{
                      wrapper: "after:bg-success-500",
                    }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium transition-all duration-300 truncate",
                    task.isCompleted ? "text-zinc-500 line-through decoration-zinc-600" : "text-zinc-200"
                  )}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-zinc-500 truncate">{task.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
