'use client';

import { useState, useEffect } from 'react';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import { Task } from '@/lib/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからタスクを読み込む
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    setIsLoading(false);
  }, []);

  // タスクの変更を保存
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">読み込み中...</div>;
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">新しいタスクを追加</h2>
        <TaskForm onSubmit={addTask} />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">タスク一覧</h2>
        <TaskList 
          tasks={tasks} 
          onUpdate={updateTask} 
          onDelete={deleteTask} 
        />
      </div>
    </div>
  );
} 