import React from "react";
import { Card, CardBody, Checkbox, cn, Input, Spinner, DatePicker, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { todosAPI } from "../../services/todos";
import { useTranslation } from "react-i18next";
import { parseDate, today as todayDate } from "@internationalized/date";

export function TodoListWidget() {
  const { t } = useTranslation();
  const [tasks, setTasks] = React.useState([]);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDueDate, setNewTaskDueDate] = React.useState(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
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
        const taskData = { title: newTaskTitle };
        if (newTaskDueDate) {
          taskData.dueDate = new Date(newTaskDueDate.year, newTaskDueDate.month - 1, newTaskDueDate.day).toISOString();
        }
        const newTask = await todosAPI.create(taskData);
        setTasks([newTask, ...tasks]);
        setNewTaskTitle("");
        setNewTaskDueDate(null);
        setShowDatePicker(false);
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

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'text-red-400', icon: 'lucide:alert-circle' };
    if (diffDays === 0) return { status: 'today', color: 'text-yellow-400', icon: 'lucide:clock' };
    if (diffDays === 1) return { status: 'tomorrow', color: 'text-blue-400', icon: 'lucide:calendar' };
    if (diffDays <= 7) return { status: 'upcoming', color: 'text-green-400', icon: 'lucide:calendar' };
    return { status: 'future', color: 'text-zinc-400', icon: 'lucide:calendar' };
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays}d`;
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

        <div className="mb-4 space-y-2">
          <div className="relative">
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
              endContent={
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  className={cn(
                    "min-w-unit-8 w-8 h-8",
                    newTaskDueDate ? "text-primary" : "text-zinc-400"
                  )}
                >
                  <Icon icon="lucide:calendar" className="text-lg" />
                </Button>
              }
            />
          </div>
          
          {showDatePicker && (
            <div className="bg-zinc-800/80 backdrop-blur-sm p-3 rounded-xl border border-zinc-700/50">
              <DatePicker
                label="Due Date"
                value={newTaskDueDate}
                onChange={setNewTaskDueDate}
                minValue={todayDate()}
                classNames={{
                  base: "w-full",
                  label: "text-zinc-400 text-xs",
                  inputWrapper: "bg-zinc-900/50 border-zinc-700/50 h-10",
                  input: "text-sm text-zinc-200",
                }}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => {
                    setNewTaskDueDate(null);
                    setShowDatePicker(false);
                  }}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  onPress={() => setShowDatePicker(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
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
            tasks.map((task) => {
              const dueDateInfo = getDueDateStatus(task.dueDate);
              return (
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

                  {task.dueDate && dueDateInfo && (
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/30",
                      dueDateInfo.color
                    )}>
                      <Icon icon={dueDateInfo.icon} className="text-xs" />
                      <span className="text-xs font-medium whitespace-nowrap">
                        {formatDueDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
}
