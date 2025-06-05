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
  let editingTaskId = null; // 編集中のタスクIDを保存
  
  // データマネージャーの準備ができるまで待機
  while (!window.dataManager) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
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

  // ローカルストレージからタスクを読み込む（Firebase対応）
  const loadTasks = async () => {
    const storedTasks = await window.dataManager.getItem('tasks');
    if (storedTasks) {
      try {
        tasks = JSON.parse(storedTasks);
        console.log('タスクを読み込みました:', tasks.length + '件');
      } catch (error) {
        console.error('タスクの解析に失敗しました:', error);
        tasks = [];
      }
    } else {
      console.log('タスクデータがありません');
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
    
    // カレンダーが存在する場合は更新
    if (calendarDays) {
      console.log('カレンダーを更新します（初期化時）');
      updateCalendar();
    }
  };

  // タスクを保存（Firebase対応）
  const saveTasks = async () => {
    await window.dataManager.setItem('tasks', JSON.stringify(tasks));
  };

  // 以下、既存のコードをそのまま継続...
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

  // ... 他の関数は既存のものと同じなので、localStorageの呼び出し部分のみ置き換えが必要

  // リアルタイム同期のセットアップ
  const setupRealtimeSync = () => {
    // タスクのリアルタイム同期
    window.dataManager.setupRealtimeSync('tasks', (data) => {
      try {
        tasks = JSON.parse(data);
        updateTaskList();
        updateFilterCounts();
        updateAssigneeTasks();
        updateWeeklyTasks();
        updateStatistics();
        updateProgressChart();
        updateDueDateTimeline();
        if (calendarDays) {
          updateCalendar();
        }
        console.log('リアルタイム同期: タスクが更新されました');
      } catch (error) {
        console.error('リアルタイム同期エラー:', error);
      }
    });

    // カテゴリのリアルタイム同期
    window.dataManager.setupRealtimeSync('businessCategories', (data) => {
      updateCategoryList();
      updateTaskFormCategories();
      console.log('リアルタイム同期: カテゴリが更新されました');
    });

    // 拠点のリアルタイム同期
    window.dataManager.setupRealtimeSync('offices', (data) => {
      updateOfficeSelect();
      updateOfficeAssigneeList();
      updateTaskFormOffices();
      console.log('リアルタイム同期: 拠点情報が更新されました');
    });
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

  // 初期化処理
  const init = async () => {
    try {
      // 接続状態表示
      showConnectionStatus();
      
      // リアルタイム同期セットアップ
      setupRealtimeSync();
      
      // データ読み込み
      await loadTasks();
      await initDefaultMasterData();
      
      // 既存の初期化処理
      updateCurrentDate();
      setInterval(updateCurrentDate, 1000);
      
      initTabs();
      initMasterManagement();
      
      console.log('アプリケーションが初期化されました');
    } catch (error) {
      console.error('初期化エラー:', error);
    }
  };

  // 初期化実行
  await init();
}); 
