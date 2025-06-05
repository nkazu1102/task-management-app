document.addEventListener('DOMContentLoaded', async () => {
  // 定数
  const STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
  };

  const PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };

  // DOM要素
  const taskForm = document.querySelector('form');
  const taskListContainer = document.querySelector('.task-list-container');
  const taskListItems = document.querySelector('.task-list-items');
  const emptyTaskMessage = document.querySelector('.empty-task-message');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('search-tasks');
  const currentDateElement = document.getElementById('current-date');
  const completionRateElement = document.getElementById('completion-rate');
  const pendingTasksElement = document.getElementById('pending-tasks');
  const overdueTasksContainer = document.getElementById('overdue-tasks');
  const todoCountElement = document.getElementById('todo-count');
  const inProgressCountElement = document.getElementById('in-progress-count');
  const completedCountElement = document.getElementById('completed-count');
  const assigneeTasksContainer = document.getElementById('assignee-tasks');
  const weeklyTasksContainer = document.getElementById('weekly-tasks');
  const taskFormContainer = document.querySelector('.task-form-container');
  const taskFormToggle = document.querySelector('.task-form-toggle');
  const taskFormContent = document.querySelector('.task-form-content');
  const taskFormTitle = document.querySelector('.card-header h2');
  const submitButton = document.querySelector('button[type="submit"]');
  const progressPercentageElement = document.getElementById('progress-percentage');
  const dueDateTimelineElement = document.getElementById('due-date-timeline');
  const timelineLabelsElement = document.getElementById('timeline-labels');
  const timelineRangeElement = document.getElementById('timeline-range');
  
  // タブ関連の要素
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // カレンダー関連の要素
  const calendarTitle = document.querySelector('.calendar-title');
  const calendarDays = document.getElementById('calendar-days');
  const calendarPeriodTasks = document.getElementById('calendar-period-tasks');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const todayButton = document.getElementById('today');
  
  // グラフキャンバス
  const progressChartCanvas = document.getElementById('progressChart');
  
  // グラフインスタンス
  let progressChart = null;
  
  // 状態
  let tasks = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let currentCalendarDate = new Date();
  let editingTaskId = null;

  // データマネージャーの準備ができるまで待機
  while (!window.dataManager) {
    console.log('DataManagerの準備中...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('DataManager準備完了');

  // 現在の日付・時間を更新
  const updateCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
    
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
      currentDateElement.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
            </svg>
            <span>${year}/${month}/${day}(${weekday})</span>
          </div>
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-mono">${hours}:${minutes}:${seconds}</span>
          </div>
        </div>
      `;
    }
  };

  // Firebase対応: タスクを読み込み
  const loadTasks = async () => {
    try {
      const storedTasks = await window.dataManager.getItem('tasks');
      if (storedTasks) {
        tasks = JSON.parse(storedTasks);
        console.log('Firebase: タスクを読み込みました:', tasks.length + '件');
      } else {
        console.log('Firebase: タスクデータがありません');
        tasks = [];
      }
    } catch (error) {
      console.error('タスクの読み込みに失敗しました:', error);
      tasks = [];
    }
    
    // 画面を更新
    updateTaskList();
    updateFilterCounts();
    updateAssigneeTasks();
    updateWeeklyTasks();
    updateStatistics();
    initProgressChart();
    updateDueDateTimeline();
    
    if (calendarDays) {
      console.log('カレンダーを更新します（初期化時）');
      updateCalendar();
    }
  };

  // Firebase対応: タスクを保存
  const saveTasks = async () => {
    try {
      await window.dataManager.setItem('tasks', JSON.stringify(tasks));
      console.log('Firebase: タスクを保存しました');
    } catch (error) {
      console.error('Firebase: タスクの保存に失敗しました:', error);
    }
  };

  // フィルターと検索に応じたタスクを取得
  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    
    // フィルターを適用
    if (currentFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === currentFilter);
    }
    
    // 検索クエリを適用
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.assignee && task.assignee.toLowerCase().includes(query))
      );
    }
    
    return filteredTasks;
  };

  // タスクリストを更新
  const updateTaskList = () => {
    const filteredTasks = getFilteredTasks();
    
    // タスクがない場合は空メッセージを表示
    if (filteredTasks.length === 0) {
      emptyTaskMessage.style.display = 'block';
      taskListItems.style.display = 'none';
      return;
    }
    
    // タスクがある場合は空メッセージを非表示
    emptyTaskMessage.style.display = 'none';
    taskListItems.style.display = 'block';
    
    // タスクリストを更新
    taskListItems.innerHTML = '';
    filteredTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      taskListItems.appendChild(taskElement);
    });
  };

  // 残日数を計算
  const getDaysRemaining = (dueDateString) => {
    if (!dueDateString) return null;
    
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // タスク要素を作成
  const createTaskElement = (task) => {
    const taskElement = document.createElement('div');
    
    // ステータスと優先度に応じたクラスを設定
    let priorityClass = 'priority-low';
    if (task.priority === PRIORITY.HIGH) {
      priorityClass = 'priority-high';
    } else if (task.priority === PRIORITY.MEDIUM) {
      priorityClass = 'priority-medium';
    }
    
    // 残日数の計算
    const daysRemaining = getDaysRemaining(task.dueDate);
    let dueDateDisplay = '';
    let dueDateClass = '';
    
    if (task.dueDate) {
      if (daysRemaining < 0) {
        dueDateDisplay = `<span class="text-red-600 font-semibold">${Math.abs(daysRemaining)}日遅れ</span>`;
        dueDateClass = 'overdue';
      } else if (daysRemaining === 0) {
        dueDateDisplay = `<span class="text-red-600 font-semibold">今日まで</span>`;
        dueDateClass = 'due-today';
      } else if (daysRemaining <= 3) {
        dueDateDisplay = `<span class="text-yellow-600 font-semibold">あと${daysRemaining}日</span>`;
        dueDateClass = 'due-soon';
      } else {
        dueDateDisplay = `<span class="text-gray-600">あと${daysRemaining}日</span>`;
        dueDateClass = 'due-normal';
      }
    }
    
    taskElement.className = `task-item ${priorityClass} ${dueDateClass}`;
    taskElement.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center mb-2">
            <h3 class="font-semibold text-gray-800 flex-1">${task.title}</h3>
            <span class="badge badge-${task.status} ml-2">${getStatusText(task.status)}</span>
          </div>
          
          ${task.description ? `<p class="text-gray-600 text-sm mb-2">${task.description}</p>` : ''}
          
          <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span class="bg-gray-100 px-2 py-1 rounded">${getPriorityText(task.priority)}</span>
            ${task.assignee ? `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">👤 ${task.assignee}</span>` : ''}
            ${task.category ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded">📂 ${task.category}</span>` : ''}
            ${task.office ? `<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded">🏢 ${task.office}</span>` : ''}
            ${task.dueDate ? `<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">📅 ${formatDate(task.dueDate)} (${dueDateDisplay})</span>` : ''}
          </div>
        </div>
        
        <div class="flex items-center space-x-2 ml-4">
          <button onclick="editTask(${JSON.stringify(task).replace(/"/g, '&quot;')})" class="text-blue-600 hover:text-blue-800 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onclick="deleteTask('${task.id}')" class="text-red-600 hover:text-red-800 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `;
    
    return taskElement;
  };

  // ステータステキストを取得
  const getStatusText = (status) => {
    switch (status) {
      case STATUS.TODO: return '未着手';
      case STATUS.IN_PROGRESS: return '進行中';
      case STATUS.COMPLETED: return '完了';
      default: return '不明';
    }
  };

  // 優先度テキストを取得
  const getPriorityText = (priority) => {
    switch (priority) {
      case PRIORITY.HIGH: return '高';
      case PRIORITY.MEDIUM: return '中';
      case PRIORITY.LOW: return '低';
      default: return '不明';
    }
  };

  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // 完全な日付フォーマット
  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}年${month}月${day}日(${weekday})`;
  };

  // タスクを追加
  const addTask = async (task) => {
    tasks.push(task);
    await saveTasks();
    updateTaskList();
    updateFilterCounts();
    updateAssigneeTasks();
    updateWeeklyTasks();
    updateStatistics();
    updateDueDateTimeline();
    if (calendarDays) {
      updateCalendar();
    }
  };

  // タスクを削除
  const deleteTask = async (id) => {
    tasks = tasks.filter(task => task.id !== id);
    await saveTasks();
    updateTaskList();
    updateFilterCounts();
    updateAssigneeTasks();
    updateWeeklyTasks();
    updateStatistics();
    updateDueDateTimeline();
    if (calendarDays) {
      updateCalendar();
    }
  };

  // グローバル関数として公開（HTMLから呼び出すため）
  window.editTask = editTask;
  window.deleteTask = deleteTask;
  window.addCategory = addCategory;
  window.addOffice = addOffice;
  window.addAssignee = addAssignee;
  window.removeCategory = removeCategory;
  window.removeOffice = removeOffice;
  window.removeAssignee = removeAssignee;

  // タスクを編集
  function editTask(task) {
    // 編集用モーダルの実装は省略（元のコードから移植）
    console.log('タスクを編集:', task);
    // 実際の編集機能はここに実装
  }

  // フィルターの更新
  const updateFilterCounts = () => {
    const todoCount = tasks.filter(task => task.status === STATUS.TODO).length;
    const inProgressCount = tasks.filter(task => task.status === STATUS.IN_PROGRESS).length;
    const completedCount = tasks.filter(task => task.status === STATUS.COMPLETED).length;
    
    if (todoCountElement) todoCountElement.textContent = todoCount;
    if (inProgressCountElement) inProgressCountElement.textContent = inProgressCount;
    if (completedCountElement) completedCountElement.textContent = completedCount;
  };

  // 担当者別タスクの更新
  const updateAssigneeTasks = () => {
    if (!assigneeTasksContainer) return;
    
    // 担当者ごとにタスクをグループ化
    const assigneeGroups = {};
    tasks.forEach(task => {
      if (task.assignee) {
        const assignees = task.assignee.split(',').map(a => a.trim());
        assignees.forEach(assignee => {
          if (!assigneeGroups[assignee]) {
            assigneeGroups[assignee] = [];
          }
          assigneeGroups[assignee].push(task);
        });
      }
    });
    
    // HTML生成
    let html = '';
    Object.keys(assigneeGroups).forEach(assignee => {
      const assigneeTasks = assigneeGroups[assignee];
      const todoCount = assigneeTasks.filter(t => t.status === STATUS.TODO).length;
      const inProgressCount = assigneeTasks.filter(t => t.status === STATUS.IN_PROGRESS).length;
      const completedCount = assigneeTasks.filter(t => t.status === STATUS.COMPLETED).length;
      
      html += `
        <div class="assignee-card">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-gray-800">${assignee}</h4>
            <span class="text-xs text-gray-500">計${assigneeTasks.length}件</span>
          </div>
          <div class="flex gap-2 text-xs">
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">未着手: ${todoCount}</span>
            <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">進行中: ${inProgressCount}</span>
            <span class="bg-green-100 text-green-800 px-2 py-1 rounded">完了: ${completedCount}</span>
          </div>
        </div>
      `;
    });
    
    if (html === '') {
      html = '<p class="text-gray-500 text-sm">担当者が設定されたタスクがありません</p>';
    }
    
    assigneeTasksContainer.innerHTML = html;
  };

  // 今週のタスクの更新
  const updateWeeklyTasks = () => {
    if (!weeklyTasksContainer) return;
    
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weeklyTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });
    
    let html = '';
    weeklyTasks.forEach(task => {
      const daysRemaining = getDaysRemaining(task.dueDate);
      let itemClass = 'weekly-task-item';
      
      if (daysRemaining < 0) {
        itemClass += ' overdue';
      } else if (daysRemaining <= 1) {
        itemClass += ' due-soon';
      }
      
      html += `
        <div class="${itemClass}">
          <div class="flex items-center justify-between">
            <span class="font-medium">${task.title}</span>
            <span class="text-xs">${formatDate(task.dueDate)}</span>
          </div>
          <div class="text-xs text-gray-600 mt-1">
            ${task.assignee ? `👤 ${task.assignee}` : ''}
          </div>
        </div>
      `;
    });
    
    if (html === '') {
      html = '<p class="text-gray-500 text-sm">今週期限のタスクがありません</p>';
    }
    
    weeklyTasksContainer.innerHTML = html;
  };

  // 統計情報の更新
  const updateStatistics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === STATUS.COMPLETED).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    if (completionRateElement) {
      completionRateElement.textContent = `${completionRate}%`;
    }
    
    if (progressPercentageElement) {
      progressPercentageElement.style.width = `${completionRate}%`;
    }
  };

  // プログレスチャートの初期化
  const initProgressChart = () => {
    if (!progressChartCanvas) return;
    
    const ctx = progressChartCanvas.getContext('2d');
    
    if (progressChart) {
      progressChart.destroy();
    }
    
    const todoCount = tasks.filter(task => task.status === STATUS.TODO).length;
    const inProgressCount = tasks.filter(task => task.status === STATUS.IN_PROGRESS).length;
    const completedCount = tasks.filter(task => task.status === STATUS.COMPLETED).length;
    
    progressChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['未着手', '進行中', '完了'],
        datasets: [{
          data: [todoCount, inProgressCount, completedCount],
          backgroundColor: [
            '#3b82f6',
            '#f59e0b', 
            '#10b981'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  };

  // 期限タイムラインの更新
  const updateDueDateTimeline = () => {
    if (!dueDateTimelineElement) return;
    
    const today = new Date();
    const timelineRange = 7; // 7日間
    
    const upcomingTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === STATUS.COMPLETED) return false;
      const daysRemaining = getDaysRemaining(task.dueDate);
      return daysRemaining >= -2 && daysRemaining <= timelineRange;
    });
    
    // タイムライントラック要素を取得または作成
    let trackElement = dueDateTimelineElement.querySelector('.timeline-track');
    if (!trackElement) {
      trackElement = document.createElement('div');
      trackElement.className = 'timeline-track';
      dueDateTimelineElement.appendChild(trackElement);
    }
    
    // 既存のタイムライン項目をクリア
    dueDateTimelineElement.querySelectorAll('.timeline-item').forEach(item => item.remove());
    
    upcomingTasks.forEach(task => {
      const daysRemaining = getDaysRemaining(task.dueDate);
      const position = Math.max(0, Math.min(100, ((daysRemaining + 2) / (timelineRange + 2)) * 100));
      
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.style.left = `${position}%`;
      item.title = `${task.title} (${formatDate(task.dueDate)})`;
      
      if (daysRemaining < 0) {
        item.classList.add('overdue');
      } else if (daysRemaining <= 2) {
        item.classList.add('due-soon');
      }
      
      dueDateTimelineElement.appendChild(item);
    });
  };

  // カレンダーの更新（簡易版）
  const updateCalendar = () => {
    if (!calendarDays) return;
    
    console.log('カレンダーを更新中...');
    // カレンダー更新の詳細実装は省略
    // 実際には既存のapp.jsから移植が必要
  };

  // UUID生成
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Firebase対応: デフォルトマスタデータの初期化
  const initDefaultMasterData = async () => {
    try {
      // カテゴリの初期化
      const categories = await window.dataManager.getItem('businessCategories');
      if (!categories) {
        const defaultCategories = [
          '営業活動',
          '開発作業',
          '企画・提案',
          '管理業務',
          '顧客対応',
          'その他'
        ];
        await window.dataManager.setItem('businessCategories', JSON.stringify(defaultCategories));
        console.log('Firebase: デフォルトカテゴリを設定しました');
      }
      
      // 拠点の初期化
      const offices = await window.dataManager.getItem('offices');
      if (!offices) {
        const defaultOffices = {
          '本社': ['田中太郎', '佐藤花子', '山田次郎'],
          '大阪支社': ['鈴木一郎', '高橋美咲'],
          '福岡支社': ['渡辺健太', '斎藤由美子']
        };
        await window.dataManager.setItem('offices', JSON.stringify(defaultOffices));
        console.log('Firebase: デフォルト拠点を設定しました');
      }
    } catch (error) {
      console.error('デフォルトマスタデータの初期化に失敗:', error);
    }
  };

  // マスタ管理用の関数（簡易版）
  function addCategory() {
    console.log('カテゴリ追加機能');
  }

  function addOffice() {
    console.log('拠点追加機能');
  }

  function addAssignee() {
    console.log('担当者追加機能');
  }

  function removeCategory(index) {
    console.log('カテゴリ削除:', index);
  }

  function removeOffice(officeName) {
    console.log('拠点削除:', officeName);
  }

  function removeAssignee(officeName, assigneeIndex) {
    console.log('担当者削除:', officeName, assigneeIndex);
  }

  // タブの初期化
  const initTabs = () => {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        
        // 全てのタブとコンテンツからactiveクラスを削除
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // 選択されたタブとコンテンツにactiveクラスを追加
        tab.classList.add('active');
        const targetContent = document.getElementById(`${tabId}-content`);
        if (targetContent) {
          targetContent.classList.add('active');
          
          // カレンダータブの場合は更新
          if (tabId === 'calendar' && calendarDays) {
            setTimeout(updateCalendar, 100);
          }
        }
      });
    });
  };

  // フォームの初期化
  const initForm = () => {
    if (!taskForm) return;
    
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('task-title')?.value;
      const priority = document.getElementById('task-priority')?.value || PRIORITY.MEDIUM;
      const category = document.getElementById('task-category')?.value || '';
      const office = document.getElementById('task-office')?.value || '';
      const mainAssignee = document.getElementById('task-main-assignee')?.value || '';
      const dueDate = document.getElementById('task-due-date')?.value || '';
      const description = document.getElementById('task-description')?.value || '';
      
      if (!title) {
        alert('タスク名を入力してください');
        return;
      }
      
      const newTask = {
        id: generateUUID(),
        title,
        description,
        priority,
        status: STATUS.TODO,
        category,
        office,
        assignee: mainAssignee,
        dueDate,
        createdAt: new Date().toISOString()
      };
      
      await addTask(newTask);
      
      // フォームをリセット
      taskForm.reset();
      
      console.log('新しいタスクを追加しました:', newTask);
    });
  };

  // フィルターボタンの初期化
  const initFilters = () => {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // 全てのボタンからactiveクラスを削除
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // クリックされたボタンにactiveクラスを追加
        button.classList.add('active');
        
        // フィルターを更新
        currentFilter = button.getAttribute('data-filter');
        updateTaskList();
      });
    });
  };

  // 検索機能の初期化
  const initSearch = () => {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      updateTaskList();
    });
  };

  // リアルタイム同期のセットアップ
  const setupRealtimeSync = () => {
    // タスクのリアルタイム同期
    window.dataManager.setupRealtimeSync('tasks', (data) => {
      try {
        const newTasks = JSON.parse(data);
        // 自分の変更による更新でない場合のみ画面を更新
        if (JSON.stringify(newTasks) !== JSON.stringify(tasks)) {
          tasks = newTasks;
          updateTaskList();
          updateFilterCounts();
          updateAssigneeTasks();
          updateWeeklyTasks();
          updateStatistics();
          if (progressChart) {
            progressChart.destroy();
            initProgressChart();
          }
          updateDueDateTimeline();
          if (calendarDays) {
            updateCalendar();
          }
          console.log('リアルタイム同期: タスクが更新されました');
        }
      } catch (error) {
        console.error('リアルタイム同期エラー:', error);
      }
    });

    // カテゴリのリアルタイム同期
    window.dataManager.setupRealtimeSync('businessCategories', (data) => {
      console.log('リアルタイム同期: カテゴリが更新されました');
      // カテゴリ選択肢の更新
      updateCategorySelects();
    });

    // 拠点のリアルタイム同期
    window.dataManager.setupRealtimeSync('offices', (data) => {
      console.log('リアルタイム同期: 拠点情報が更新されました');
      // 拠点選択肢の更新
      updateOfficeSelects();
    });
  };

  // カテゴリ選択肢の更新
  const updateCategorySelects = async () => {
    try {
      const categories = await window.dataManager.getItem('businessCategories');
      if (categories) {
        const categoryArray = JSON.parse(categories);
        const categorySelects = document.querySelectorAll('#task-category, #edit-category');
        
        categorySelects.forEach(select => {
          const currentValue = select.value;
          select.innerHTML = '<option value="">カテゴリーを選択</option>';
          
          categoryArray.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === currentValue) {
              option.selected = true;
            }
            select.appendChild(option);
          });
        });
      }
    } catch (error) {
      console.error('カテゴリ選択肢の更新エラー:', error);
    }
  };

  // 拠点選択肢の更新
  const updateOfficeSelects = async () => {
    try {
      const offices = await window.dataManager.getItem('offices');
      if (offices) {
        const officeData = JSON.parse(offices);
        const officeSelects = document.querySelectorAll('#task-office, #edit-office');
        
        officeSelects.forEach(select => {
          const currentValue = select.value;
          select.innerHTML = '<option value="">拠点を選択</option>';
          
          Object.keys(officeData).forEach(office => {
            const option = document.createElement('option');
            option.value = office;
            option.textContent = office;
            if (office === currentValue) {
              option.selected = true;
            }
            select.appendChild(option);
          });
        });
      }
    } catch (error) {
      console.error('拠点選択肢の更新エラー:', error);
    }
  };

  // Firebase接続状態表示
  const showConnectionStatus = () => {
    const statusElement = document.createElement('div');
    statusElement.id = 'firebase-status';
    statusElement.className = 'fixed top-4 right-4 px-3 py-1 rounded text-xs font-medium z-50';
    
    if (window.dataManager.isOnline()) {
      statusElement.textContent = '🔥 Firebase接続中';
      statusElement.className += ' bg-green-100 text-green-800';
    } else {
      statusElement.textContent = '📴 オフラインモード';
      statusElement.className += ' bg-yellow-100 text-yellow-800';
    }
    
    document.body.appendChild(statusElement);
    
    // 5秒後に非表示
    setTimeout(() => {
      statusElement.remove();
    }, 5000);
  };

  // マスタ管理機能の初期化（簡易版）
  const initMasterManagement = async () => {
    console.log('マスタ管理機能を初期化しました');
    await updateCategorySelects();
    await updateOfficeSelects();
  };

  // 初期化処理
  const init = async () => {
    try {
      console.log('Firebase対応アプリケーションを初期化中...');
      
      // 接続状態表示
      showConnectionStatus();
      
      // リアルタイム同期セットアップ
      setupRealtimeSync();
      
      // データ読み込み
      await initDefaultMasterData();
      await loadTasks();
      
      // UI初期化
      updateCurrentDate();
      setInterval(updateCurrentDate, 1000);
      
      initTabs();
      initForm();
      initFilters();
      initSearch();
      await initMasterManagement();
      
      console.log('Firebase対応アプリケーションの初期化が完了しました');
    } catch (error) {
      console.error('初期化エラー:', error);
    }
  };

  // 初期化実行
  await init();

  // グローバル関数として公開
  window.updateCalendar = updateCalendar;
  window.generateUUID = generateUUID;
}); 
