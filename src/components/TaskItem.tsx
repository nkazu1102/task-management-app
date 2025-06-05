'use client';

import { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(editedTask);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedTask({
      ...editedTask,
      [name]: value,
      updatedAt: new Date().toISOString()
    });
  };

  // 優先度に応じたバッジの色を返す
  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ステータスに応じたバッジの色を返す
  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.TODO:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 日付をフォーマットする
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '期限なし';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              name="title"
              value={editedTask.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              name="description"
              value={editedTask.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                name="status"
                value={editedTask.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={TaskStatus.TODO}>未着手</option>
                <option value={TaskStatus.IN_PROGRESS}>進行中</option>
                <option value={TaskStatus.COMPLETED}>完了</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先度
              </label>
              <select
                name="priority"
                value={editedTask.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={TaskPriority.LOW}>低</option>
                <option value={TaskPriority.MEDIUM}>中</option>
                <option value={TaskPriority.HIGH}>高</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期限
              </label>
              <input
                type="date"
                name="dueDate"
                value={editedTask.dueDate || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow border-l-4 ${
      task.status === TaskStatus.COMPLETED 
        ? 'border-green-500' 
        : task.priority === TaskPriority.HIGH 
          ? 'border-red-500' 
          : task.priority === TaskPriority.MEDIUM 
            ? 'border-yellow-500' 
            : 'border-blue-500'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-500 hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-500 hover:text-danger"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-gray-600 mb-3">{task.description}</p>
      )}
      
      <div className="flex flex-wrap gap-2 mt-2">
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(task.status)}`}>
          {task.status === TaskStatus.TODO && '未着手'}
          {task.status === TaskStatus.IN_PROGRESS && '進行中'}
          {task.status === TaskStatus.COMPLETED && '完了'}
        </span>
        
        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadgeClass(task.priority)}`}>
          優先度: {task.priority === TaskPriority.LOW && '低'}
          {task.priority === TaskPriority.MEDIUM && '中'}
          {task.priority === TaskPriority.HIGH && '高'}
        </span>
        
        {task.dueDate && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
            期限: {formatDate(task.dueDate)}
          </span>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        作成: {formatDate(task.createdAt)}
        {task.updatedAt !== task.createdAt && ` (更新: ${formatDate(task.updatedAt)})`}
      </div>
    </div>
  );
} 
