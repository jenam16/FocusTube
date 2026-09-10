import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  ListTodo,
} from 'lucide-react';
import { taskService } from '../../services';
import { TaskItem } from '../../types';
import { ProgressBar } from '../ProgressBar';

interface DailyTaskListProps {
  compact?: boolean;
}

export const DailyTaskList: React.FC<DailyTaskListProps> = ({ compact = false }) => {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskService.getTasks,
  });

  const tasks = data?.tasks || [];
  const summary = data?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    completionPercentage: 0,
  };

  const createMutation = useMutation({
    mutationFn: (title: string) => taskService.createTask({ title }),
    onSuccess: () => {
      setNewTitle('');
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to add task';
      setErrorMsg(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { title?: string; completed?: boolean };
    }) => taskService.updateTask(taskId, payload),
    onSuccess: () => {
      setEditingId(null);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      setErrorMsg(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createMutation.mutate(newTitle.trim());
  };

  const handleStartEdit = (task: TaskItem) => {
    setEditingId(task._id);
    setEditTitle(task.title);
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editTitle.trim()) return;
    updateMutation.mutate({ taskId, payload: { title: editTitle.trim() } });
  };

  const handleToggleComplete = (task: TaskItem) => {
    updateMutation.mutate({
      taskId: task._id,
      payload: { completed: !task.completed },
    });
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-4">
      {/* Header with Title and Progress */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-red-400" />
          <h3 className="text-base font-bold text-white">Daily Learning Tasks</h3>
        </div>

        {summary.totalTasks > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-300">
              {summary.completedTasks} / {summary.totalTasks} completed
            </span>
            <div className="w-24">
              <ProgressBar progress={summary.completionPercentage} size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Add Task Input Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="e.g. Practice useEffect, Complete lesson 3..."
          maxLength={200}
          className="flex-1 rounded-xl border border-gray-800 bg-gray-950/60 px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || createMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-red-600/20 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          <span>Add</span>
        </button>
      </form>

      {errorMsg && (
        <div className="text-xs text-red-400 font-medium">{errorMsg}</div>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-xs text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 p-6 text-center text-xs text-gray-500">
          No daily tasks yet. Add what you plan to learn today!
        </div>
      ) : (
        <div
          className={`divide-y divide-gray-800/50 overflow-y-auto ${
            compact ? 'max-h-56' : 'max-h-80'
          }`}
        >
          {tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between gap-3 py-2.5 px-1 group transition-colors hover:bg-gray-800/20 rounded-lg"
            >
              {/* Checkbox and Title */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(task)}
                  className="shrink-0 text-gray-400 hover:text-white transition-colors focus:outline-none"
                  aria-label={
                    task.completed ? 'Mark task incomplete' : 'Mark task complete'
                  }
                >
                  {task.completed ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-500 hover:text-gray-300" />
                  )}
                </button>

                {editingId === task._id ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={200}
                      autoFocus
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(task._id)}
                      className="rounded p-1 text-emerald-400 hover:bg-gray-800"
                      aria-label="Save task edit"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-800"
                      aria-label="Cancel task edit"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-xs truncate select-none ${
                      task.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-200'
                    }`}
                  >
                    {task.title}
                  </span>
                )}
              </div>

              {/* Actions: Edit & Delete */}
              {editingId !== task._id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(task)}
                    className="rounded p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                    aria-label="Edit task"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(task._id)}
                    className="rounded p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
