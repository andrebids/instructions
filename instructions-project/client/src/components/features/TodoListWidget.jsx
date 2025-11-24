import React from "react";
import { Card, CardBody, Checkbox, cn } from "@heroui/react";
import { Icon } from "@iconify/react";

export function TodoListWidget() {
  const [tasks, setTasks] = React.useState([
    { id: 1, text: "Call City Hall regarding permits", completed: false },
    { id: 2, text: "Check stock for 'Gold Star' units", completed: true },
    { id: 3, text: "Review 'Mall of the South' proposal", completed: false },
    { id: 4, text: "Schedule team meeting", completed: false },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <Card className="h-full bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icon icon="lucide:list-todo" className="text-primary" />
            To-Do List
          </h3>
          <span className="text-xs text-zinc-500">{tasks.filter(t => !t.completed).length} pending</span>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                task.completed ? "bg-zinc-800/30" : "bg-zinc-800/50 hover:bg-zinc-800"
              )}
            >
              <Checkbox 
                isSelected={task.completed} 
                onValueChange={() => toggleTask(task.id)}
                color="success"
                size="sm"
                classNames={{
                  label: "w-full"
                }}
              >
                <span className={cn(
                  "text-sm transition-all",
                  task.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                )}>
                  {task.text}
                </span>
              </Checkbox>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
