import React from "react";
import { Card, CardBody, Checkbox, cn, Input, Spinner, DatePicker, Button, Chip, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { todosAPI } from "../../services/todos";
import { useTranslation } from "react-i18next";
import { parseDate, today as todayDate, CalendarDate } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";
import { motion, AnimatePresence } from "framer-motion";

export function TodoListWidget() {
  const { t, i18n } = useTranslation();
  
  // Mapear código do idioma do i18n para locale do toLocaleDateString
  const getLocaleFromLanguage = (lang) => {
    const localeMap = {
      'pt': 'pt-PT',
      'en': 'en-US',
      'fr': 'fr-FR'
    };
    return localeMap[lang] || 'pt-PT';
  };
  const [tasks, setTasks] = React.useState([]);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDueDate, setNewTaskDueDate] = React.useState(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [clearingCompleted, setClearingCompleted] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

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

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      setCreating(true);
      const taskData = { title: newTaskTitle };
      if (newTaskDueDate) {
        taskData.dueDate = new Date(newTaskDueDate.year, newTaskDueDate.month - 1, newTaskDueDate.day).toISOString();
      }
      console.log("Creating task with data:", taskData);
      const newTask = await todosAPI.create(taskData);
      setTasks([newTask, ...tasks]);
      setNewTaskTitle("");
      setNewTaskDueDate(null);
      setShowDatePicker(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Erro ao criar task: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !showDatePicker) {
      handleCreateTask();
    }
  };

  const setQuickDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setNewTaskDueDate(new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    ));
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

  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.isCompleted);
    if (completedTasks.length === 0) return;

    // Show modal instead of window.confirm
    setShowConfirmModal(true);
  };

  const confirmClearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.isCompleted);

    try {
      setClearingCompleted(true);
      setShowConfirmModal(false);
      
      // Delete all completed tasks
      await Promise.all(
        completedTasks.map(task => todosAPI.delete(task.id))
      );
      
      // Update UI - remove completed tasks
      setTasks(tasks.filter(t => !t.isCompleted));
    } catch (error) {
      console.error("Failed to clear completed tasks:", error);
      alert(t('pages.dashboard.todoListWidget.clearCompleted.error'));
    } finally {
      setClearingCompleted(false);
    }
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'text-danger-400', icon: 'lucide:alert-circle' };
    if (diffDays === 0) return { status: 'today', color: 'text-warning-400', icon: 'lucide:clock' };
    if (diffDays === 1) return { status: 'tomorrow', color: 'text-primary-400', icon: 'lucide:calendar' };
    if (diffDays <= 7) return { status: 'upcoming', color: 'text-success-400', icon: 'lucide:calendar' };
    return { status: 'future', color: 'text-default-400', icon: 'lucide:calendar' };
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return t('pages.dashboard.todoListWidget.dateFormatting.overdue', { days: Math.abs(diffDays) });
    if (diffDays === 0) return t('pages.dashboard.todoListWidget.dateFormatting.today');
    if (diffDays === 1) return t('pages.dashboard.todoListWidget.dateFormatting.tomorrow');
    if (diffDays <= 7) return t('pages.dashboard.todoListWidget.dateFormatting.days', { days: diffDays });
    const locale = getLocaleFromLanguage(i18n.language);
    return due.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  };

  const locale = getLocaleFromLanguage(i18n.language);
  const today = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const completedCount = tasks.filter(t => t.isCompleted).length;

  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm rounded-3xl">
      <CardBody className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500/10 p-2 rounded-xl">
               <Icon icon="lucide:check-square" className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{t('pages.dashboard.todoListWidget.title')}</h3>
              <p className="text-xs text-default-500 font-medium">{today}</p>
            </div>
          </div>
          <AnimatePresence>
            {completedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip
                  content={t('pages.dashboard.todoListWidget.clearCompleted.tooltip', {
                    count: completedCount
                  })}
                  placement="left"
                  delay={300}
                  closeDelay={0}
                  classNames={{
                    content: "bg-zinc-800 text-zinc-200 text-xs px-3 py-2 border border-zinc-700/50"
                  }}
                >
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={handleClearCompleted}
                    isLoading={clearingCompleted}
                    isDisabled={clearingCompleted}
                    className="h-8 w-8 min-w-unit-8 text-default-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Icon icon="lucide:trash-2" className="text-base" />
                  </Button>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          className="mb-4 space-y-3"
          initial={false}
          animate={{ height: "auto" }}
        >
          <div className="relative">
            <Input
              placeholder={t('pages.dashboard.todoListWidget.addTaskPlaceholder')}
              value={newTaskTitle}
              onValueChange={setNewTaskTitle}
              onKeyDown={handleKeyDown}
              isDisabled={creating}
              classNames={{
                input: "text-sm",
                inputWrapper: "bg-default-100/50 border-default-200/50 hover:bg-default-200/50 focus-within:bg-default-200/50 h-11 rounded-xl",
              }}
              startContent={
                <Icon icon="lucide:plus" className="text-default-400" />
              }
              endContent={
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setShowDatePicker(!showDatePicker)}
                    className={cn(
                      "min-w-unit-8 w-8 h-8 transition-colors",
                      newTaskDueDate ? "text-primary" : "text-default-400"
                    )}
                  >
                    <Icon icon="lucide:calendar" className="text-lg" />
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleCreateTask}
                    isLoading={creating}
                    isDisabled={!newTaskTitle.trim() || creating}
                    className="h-8 px-4 font-medium"
                  >
                    {t('pages.dashboard.todoListWidget.create')}
                  </Button>
                </div>
              }
            />
          </div>
          
          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="bg-content1/80 backdrop-blur-sm p-4 rounded-xl border border-default-200/50 space-y-3 shadow-lg">
                  {/* Quick Date Shortcuts */}
                  <div className="flex gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setQuickDate(0)}
                    >
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:sun" className="text-xs" />
                        <span className="text-xs">{t('pages.dashboard.todoListWidget.quickDates.today')}</span>
                      </div>
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setQuickDate(1)}
                    >
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:sunrise" className="text-xs" />
                        <span className="text-xs">{t('pages.dashboard.todoListWidget.quickDates.tomorrow')}</span>
                      </div>
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setQuickDate(7)}
                    >
                      <div className="flex items-center gap-1">
                        <Icon icon="lucide:calendar-days" className="text-xs" />
                        <span className="text-xs">{t('pages.dashboard.todoListWidget.quickDates.nextWeek')}</span>
                      </div>
                    </Chip>
                  </div>

                  <I18nProvider locale="pt-PT">
                    <DatePicker
                      label={t('pages.dashboard.todoListWidget.datePicker.label')}
                      value={newTaskDueDate || undefined}
                      onChange={setNewTaskDueDate}
                      minValue={todayDate()}
                      classNames={{
                        base: "w-full",
                        label: "text-default-400 text-xs",
                        inputWrapper: "bg-default-100/50 border-default-200/50 h-10",
                        input: "text-sm text-foreground",
                      }}
                    />
                  </I18nProvider>
                  
                  {newTaskDueDate && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20"
                    >
                      <span className="text-xs text-primary font-medium">
                        {t('pages.dashboard.todoListWidget.datePicker.selectedDate', { date: formatDueDate(new Date(newTaskDueDate.year, newTaskDueDate.month - 1, newTaskDueDate.day)) })}
                      </span>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => setNewTaskDueDate(null)}
                        className="h-6 min-w-unit-16"
                      >
                        {t('pages.dashboard.todoListWidget.datePicker.clear')}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner size="md" color="primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-default-500 text-sm">
              {t('pages.dashboard.todoListWidget.emptyState')}
            </div>
          ) : (

            <AnimatePresence mode="popLayout">
              {[...tasks]
                .sort((a, b) => {
                  // Sort by completion status (pending first)
                  if (a.isCompleted === b.isCompleted) return 0;
                  return a.isCompleted ? 1 : -1;
                })
                .map((task) => {
                const dueDateInfo = getDueDateStatus(task.dueDate);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: task.isCompleted ? 0.5 : 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    layout
                  >
                    <div 
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 border border-transparent",
                        task.isCompleted 
                          ? "bg-default-100/50" 
                          : "bg-default-50 hover:bg-default-100 hover:border-default-200/50 hover:shadow-sm"
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
                          task.isCompleted ? "text-default-400 line-through decoration-default-400" : "text-foreground"
                        )}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-default-400 truncate">{task.description}</p>
                        )}
                      </div>

                      {task.dueDate && dueDateInfo && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg bg-default-100/50 border border-default-200/50",
                            dueDateInfo.color
                          )}
                        >
                          <Icon icon={dueDateInfo.icon} className="text-xs" />
                          <span className="text-xs font-medium whitespace-nowrap">
                            {formatDueDate(task.dueDate)}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Confirmation Modal */}
        <Modal 
          isOpen={showConfirmModal} 
          onClose={() => setShowConfirmModal(false)}
          classNames={{
            base: "bg-zinc-900 border border-zinc-800",
            header: "border-b border-zinc-800",
            body: "py-6",
            footer: "border-t border-zinc-800",
          }}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <Icon icon="lucide:trash-2" className="text-red-400 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t('pages.dashboard.todoListWidget.clearCompleted.modal.title')}
                </h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-default-500 text-sm">
                {t('pages.dashboard.todoListWidget.clearCompleted.modal.message', {
                  count: completedCount
                })}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="light" 
                onPress={() => setShowConfirmModal(false)}
                className="text-default-500 hover:text-foreground"
              >
                {t('pages.dashboard.todoListWidget.clearCompleted.modal.cancel')}
              </Button>
              <Button 
                color="danger" 
                onPress={confirmClearCompleted}
                isLoading={clearingCompleted}
                startContent={!clearingCompleted && <Icon icon="lucide:trash-2" />}
              >
                {t('pages.dashboard.todoListWidget.clearCompleted.modal.confirm')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
}
