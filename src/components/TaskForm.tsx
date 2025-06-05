'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';

interface TaskFormProps {
  onSubmit: (task: Task) => void;
  initialTask?: Partial<Task>;
}

export default function TaskForm({ onSubmit, initialTask }: TaskFormProps) {
  const [task, setTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    ...initialTask
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date().toISOString();
    const newTask: Task = {
      id: task.id || uuidv4(),
      title: task.title || '',
      description: task.description || '',
      status: task.status || TaskStatus.TODO,
      priority: task.priority || TaskPriority.MEDIUM,
      dueDate: task.dueDate || null,
      createdAt: task.createdAt || now,
      updatedAt: now
    };
    
    onSubmit(newTask);
    
    // フォームをリセット（初期タスクがない場合のみ）
    if (!initialTask) {
      setTask({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTask({
      ...task,
      [name]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={task.title || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            value={task.description || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              id="status"
              name="status"
              value={task.status || TaskStatus.TODO}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={TaskStatus.TODO}>未着手</option>
              <option value={TaskStatus.IN_PROGRESS}>進行中</option>
              <option value={TaskStatus.COMPLETED}>完了</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              優先度
            </label>
            <select
              id="priority"
              name="priority"
              value={task.priority || TaskPriority.MEDIUM}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={TaskPriority.LOW}>低</option>
              <option value={TaskPriority.MEDIUM}>中</option>
              <option value={TaskPriority.HIGH}>高</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              期限
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={task.dueDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {initialTask ? '更新' : '追加'}
          </button>
        </div>
      </form>
    </div>
  );
} 
