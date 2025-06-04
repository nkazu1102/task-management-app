'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/lib/types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onUpdate, onDelete }: TaskListProps) {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  // ステータスとタスク数を表示するバッジ
  const getStatusCount = (status: TaskStatus | 'all') => {
    if (status === 'all') return tasks.length;
    return tasks.filter(task => task.status === status).length;
  };

  return (
    <div>
      <div className="flex mb-4 space-x-2 overflow-x-auto pb-2">
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setFilter('all')}
        >
          全て <span className="ml-1 bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
            {getStatusCount('all')}
          </span>
        </button>
        
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === TaskStatus.TODO 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setFilter(TaskStatus.TODO)}
        >
          未着手 <span className="ml-1 bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
            {getStatusCount(TaskStatus.TODO)}
          </span>
        </button>
        
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === TaskStatus.IN_PROGRESS 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setFilter(TaskStatus.IN_PROGRESS)}
        >
          進行中 <span className="ml-1 bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
            {getStatusCount(TaskStatus.IN_PROGRESS)}
          </span>
        </button>
        
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === TaskStatus.COMPLETED 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setFilter(TaskStatus.COMPLETED)}
        >
          完了 <span className="ml-1 bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
            {getStatusCount(TaskStatus.COMPLETED)}
          </span>
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          表示するタスクがありません
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 