document.addEventListener('DOMContentLoaded', () => {
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

  // ローカルストレージからタスクを読み込む
  const loadTasks = async () => {
    try {
      const storedTasks = await window.dataManager.getItem('tasks');
      if (storedTasks) {
        try {
          tasks = JSON.parse(storedTasks);
          console.log('データストレージからタスクを読み込みました:', tasks.length + '件');
        } catch (error) {
          console.error('タスクの解析に失敗しました:', error);
          tasks = [];
        }
      } else {
        console.log('データストレージにタスクデータがありません');
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
    
    // カレンダーが存在する場合は更新
    if (calendarDays) {
      console.log('カレンダーを更新します（初期化時）');
      updateCalendar();
    }
  };

  // タスクを保存
  const saveTasks = async () => {
    try {
      await window.dataManager.setItem('tasks', JSON.stringify(tasks));
      console.log('タスクを保存しました');
    } catch (error) {
      console.error('タスクの保存に失敗しました:', error);
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
    console.log('🔄 updateTaskList 開始 - タスク数:', tasks.length);
    
    const filteredTasks = getFilteredTasks();
    console.log('📊 フィルター後のタスク数:', filteredTasks.length);
    
    const emptyTaskMessage = document.querySelector('.empty-task-message');
    const taskListItems = document.querySelector('.task-list-items');
    
    console.log('🔍 DOM要素の確認:');
    console.log('- emptyTaskMessage:', emptyTaskMessage ? '存在' : '見つからない');
    console.log('- taskListItems:', taskListItems ? '存在' : '見つからない');
    
    if (!taskListItems) {
      console.error('❌ .task-list-items 要素が見つかりません');
      return;
    }
    
    // タスクがない場合は空メッセージを表示
    if (filteredTasks.length === 0) {
      console.log('📭 タスクが0件のため空メッセージを表示');
      if (emptyTaskMessage) emptyTaskMessage.style.display = 'block';
      taskListItems.style.display = 'none';
      taskListItems.innerHTML = '';
      return;
    }
    
    // タスクがある場合は空メッセージを非表示
    console.log('📝 タスクが' + filteredTasks.length + '件あるためリストを表示');
    if (emptyTaskMessage) emptyTaskMessage.style.display = 'none';
    taskListItems.style.display = 'block';
    
    // 既存のコンテンツをクリア
    console.log('🧹 既存のタスクリストをクリア');
    taskListItems.innerHTML = '';
    
    // タスクリストを再構築
    console.log('🏗️ タスクリストを再構築開始');
    filteredTasks.forEach((task, index) => {
      console.log(`📋 タスク ${index + 1}: "${task.title}" を追加中`);
      const taskElement = createTaskElement(task);
      taskListItems.appendChild(taskElement);
    });
    
    // 強制的にDOM更新を確認
    const finalTaskCount = taskListItems.children.length;
    console.log('✅ 最終的なDOM内タスク数:', finalTaskCount);
    
    // 強制的に再描画をトリガー
    taskListItems.style.display = 'none';
    taskListItems.offsetHeight; // 強制的なリフロー
    taskListItems.style.display = 'block';
    
    console.log('🎉 updateTaskList 完了');
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
    
    taskElement.className = `task-item ${priorityClass} mb-2`;
    
    // 期限の日付オブジェクトを作成
    let dueDate = null;
    if (task.dueDate) {
      dueDate = new Date(task.dueDate);
    }
    
    // 期限が過ぎているかどうかを判定
    const isOverdue = dueDate && dueDate < new Date() && task.status !== STATUS.COMPLETED;
    
    // 残日数を計算
    const daysRemaining = task.dueDate ? getDaysRemaining(task.dueDate) : null;
    let daysRemainingText = '';
    if (daysRemaining !== null) {
      if (daysRemaining === 0) {
        daysRemainingText = '(今日期限)';
      } else if (daysRemaining > 0) {
        daysRemainingText = `(あと${daysRemaining}日)`;
      } else {
        daysRemainingText = `(${Math.abs(daysRemaining)}日超過)`;
      }
    }
    
    // 期間タスクかどうかを判定
    const isPeriodTask = task.startDate && task.dueDate;
    
    // ステータスに応じたバッジクラスを設定
    let statusBadgeClass = 'badge-primary';
    if (task.status === STATUS.TODO) {
      statusBadgeClass = 'badge-warning';
    } else if (task.status === STATUS.IN_PROGRESS) {
      statusBadgeClass = 'badge-primary';
    } else if (task.status === STATUS.COMPLETED) {
      statusBadgeClass = 'badge-success';
    }
    
    // 優先度に応じたバッジクラスを設定
    let priorityBadgeClass = 'badge-success';
    if (task.priority === PRIORITY.HIGH) {
      priorityBadgeClass = 'badge-danger';
    } else if (task.priority === PRIORITY.MEDIUM) {
      priorityBadgeClass = 'badge-warning';
    }
    
    // 担当者の配列を作成（文字列がカンマ区切りの場合は分割）
    const assignees = task.assignee ? task.assignee.split(',').map(a => a.trim()).filter(a => a) : [];
    
    taskElement.innerHTML = `
      <div class="flex justify-between items-start mb-1">
        <h3 class="text-base font-semibold ${isOverdue ? 'text-red-600' : ''}">${task.title}</h3>
        <div class="flex space-x-1">
          <button class="p-1 text-gray-500 hover:text-blue-600 edit-task" title="編集">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="p-1 text-gray-500 hover:text-red-600 delete-task" title="削除">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      ${task.description ? `<p class="text-gray-600 text-xs mb-1">${task.description}</p>` : ''}
      
      <div class="flex flex-wrap gap-1 mt-1">
        <span class="badge ${statusBadgeClass} text-2xs">
          ${getStatusText(task.status)}
        </span>
        <span class="badge ${priorityBadgeClass} text-2xs">
          優先度: ${getPriorityText(task.priority)}
        </span>
        ${task.category ? `<span class="badge bg-indigo-100 text-indigo-800 text-2xs">カテゴリー: ${task.category}</span>` : ''}
        ${task.office ? `<span class="badge bg-cyan-100 text-cyan-800 text-2xs">拠点: ${task.office}</span>` : ''}
        ${assignees.length > 0 ? 
          assignees.map(assignee => 
            `<span class="badge badge-primary text-2xs">担当: ${assignee}</span>`
          ).join('') : 
          ''
        }
        ${isPeriodTask ? 
          `<span class="badge ${isOverdue ? 'badge-danger' : 'badge-primary'} text-2xs">
            期間: ${formatDate(task.startDate)} 〜 ${formatDate(task.dueDate)} ${daysRemainingText}
           </span>` : 
          `${task.startDate ? `<span class="badge badge-primary text-2xs">日付: ${formatDate(task.startDate)}</span>` : ''}
           ${task.dueDate ? `<span class="badge ${isOverdue ? 'badge-danger' : 'badge-primary'} text-2xs">終了: ${formatDate(task.dueDate)} ${daysRemainingText}</span>` : ''}`
        }
      </div>
    `;
    
    // 削除ボタンのイベントリスナーを追加
    const deleteButton = taskElement.querySelector('.delete-task');
    deleteButton.addEventListener('click', () => {
      if (confirm('このタスクを削除してもよろしいですか？')) {
        deleteTask(task.id);
      }
    });
    
    // 編集ボタンのイベントリスナーを追加
    const editButton = taskElement.querySelector('.edit-task');
    editButton.addEventListener('click', () => {
      editTask(task);
    });
    
    return taskElement;
  };

  // ステータスのテキストを取得
  const getStatusText = (status) => {
    switch (status) {
      case STATUS.TODO: return '未着手';
      case STATUS.IN_PROGRESS: return '進行中';
      case STATUS.COMPLETED: return '完了';
      default: return '';
    }
  };

  // 優先度のテキストを取得
  const getPriorityText = (priority) => {
    switch (priority) {
      case PRIORITY.LOW: return '低';
      case PRIORITY.MEDIUM: return '中';
      case PRIORITY.HIGH: return '高';
      default: return '';
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '期限なし';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${month}月${day}日(${weekday})`;
  };

  // 詳細な日付フォーマット（年を含む）
  const formatFullDate = (dateString) => {
    if (!dateString) return '未設定';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}年${month}月${day}日(${weekday})`;
  };

  // タスクを追加
  const addTask = (task) => {
    tasks.push(task);
    saveTasks();
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
  const deleteTask = (id) => {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
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

  // タスクを編集
  const editTask = (task) => {
    // 編集用モーダルが既に存在する場合は削除
    const existingModal = document.getElementById('edit-task-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 担当者配列の準備（カンマ区切りの文字列から配列へ）
    let assignees = [];
        if (task.assignee) {
      assignees = task.assignee.split(',').map(a => a.trim()).filter(a => a);
    }
    
    // 編集用モーダルを作成
    const modalElement = document.createElement('div');
    modalElement.id = 'edit-task-modal';
    modalElement.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    // モーダル内のフォーム
    modalElement.innerHTML = `
      <div class="modal-content bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
        <div class="p-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              タスクを編集
            </h3>
            <button type="button" class="modal-close text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
            </div>
            
        <form id="edit-task-form" class="p-4">
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div class="col-span-2">
              <label for="edit-title" class="block text-sm font-medium text-gray-700 mb-1">タイトル <span class="text-red-500">*</span></label>
              <input type="text" id="edit-title" class="form-input w-full border border-gray-300 rounded p-2" value="${task.title}" placeholder="タスクのタイトルを入力" required>
        </div>
            <div>
              <label for="edit-priority" class="block text-sm font-medium text-gray-700 mb-1">優先度 <span class="text-red-500">*</span></label>
              <select id="edit-priority" class="form-select w-full border border-gray-300 rounded p-2">
                <option value="low" ${task.priority === PRIORITY.LOW ? 'selected' : ''}>低</option>
                <option value="medium" ${task.priority === PRIORITY.MEDIUM ? 'selected' : ''}>中</option>
                <option value="high" ${task.priority === PRIORITY.HIGH ? 'selected' : ''}>高</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label for="edit-category" class="block text-sm font-medium text-gray-700 mb-1">業務カテゴリー</label>
              <select id="edit-category" class="form-select w-full border border-gray-300 rounded p-2">
                <option value="">カテゴリーを選択</option>
                <!-- カテゴリーはJavaScriptで動的に追加 -->
              </select>
            </div>
            <div>
              <label for="edit-office" class="block text-sm font-medium text-gray-700 mb-1">拠点</label>
              <select id="edit-office" class="form-select w-full border border-gray-300 rounded p-2">
                <option value="">拠点を選択</option>
                <!-- 拠点はJavaScriptで動的に追加 -->
              </select>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="edit-description" class="block text-sm font-medium text-gray-700 mb-1">詳細</label>
            <textarea id="edit-description" class="form-input w-full border border-gray-300 rounded p-2" rows="2" placeholder="タスクの詳細を入力（任意）">${task.description || ''}</textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label for="edit-status" class="block text-sm font-medium text-gray-700 mb-1">ステータス <span class="text-red-500">*</span></label>
              <select id="edit-status" class="form-select w-full border border-gray-300 rounded p-2">
                <option value="todo" ${task.status === STATUS.TODO ? 'selected' : ''}>未着手</option>
                <option value="in-progress" ${task.status === STATUS.IN_PROGRESS ? 'selected' : ''}>進行中</option>
                <option value="completed" ${task.status === STATUS.COMPLETED ? 'selected' : ''}>完了</option>
              </select>
            </div>
            
            <div>
              <label for="edit-start-date" class="block text-sm font-medium text-gray-700 mb-1">開始日</label>
              <input type="date" id="edit-start-date" class="form-input w-full border border-gray-300 rounded p-2" value="${task.startDate || ''}" placeholder="開始日を選択">
              <div class="text-xs text-gray-600 mt-1" id="edit-start-date-display">${task.startDate ? formatFullDate(task.startDate) : ''}</div>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="edit-due-date" class="block text-sm font-medium text-gray-700 mb-1">終了日</label>
            <input type="date" id="edit-due-date" class="form-input w-full border border-gray-300 rounded p-2" value="${task.dueDate || ''}" placeholder="終了日を選択">
            <div class="text-xs text-gray-600 mt-1" id="edit-due-date-display">${task.dueDate ? formatFullDate(task.dueDate) : ''}</div>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">担当者</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs text-gray-500 mb-1">主担当者</label>
                <select id="edit-assignee1" class="form-select w-full border border-gray-300 rounded p-2">
                  <option value="">主担当者を選択</option>
                  <!-- 担当者1はJavaScriptで動的に追加 -->
                </select>
                </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">副担当者1</label>
                <select id="edit-assignee2" class="form-select w-full border border-gray-300 rounded p-2">
                  <option value="">担当者を選択</option>
                  <!-- 担当者2はJavaScriptで動的に追加 -->
                </select>
          </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">副担当者2</label>
                <select id="edit-assignee3" class="form-select w-full border border-gray-300 rounded p-2">
                  <option value="">担当者を選択</option>
                  <!-- 担当者3はJavaScriptで動的に追加 -->
                </select>
        </div>
            </div>
          </div>
          
          <div class="flex flex-wrap justify-end space-x-2">
            <button type="button" id="edit-complete-btn" class="btn-success py-2 px-4 mr-auto bg-green-600 hover:bg-green-700 text-white font-medium rounded">
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              完了にする
              </span>
            </button>
            <button type="button" class="btn-secondary py-2 px-4 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700 font-medium modal-cancel">キャンセル</button>
            <button type="submit" class="btn-primary py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded">
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                更新
              </span>
            </button>
          </div>
        </form>
        </div>
      `;
    
    // モーダルを本文に追加
    document.body.appendChild(modalElement);
    
    // 編集フォームのマスタデータ連携機能を初期化
    initEditFormMasterData(task, assignees);
    
    // モーダルを閉じる処理
    const closeModal = () => {
      modalElement.remove();
    };
    
    // 閉じるボタンイベント
    modalElement.querySelector('.modal-close').addEventListener('click', closeModal);
    modalElement.querySelector('.modal-cancel').addEventListener('click', closeModal);
    
    // 背景クリックでも閉じる
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) {
        closeModal();
      }
    });
    
    // 日付入力の変更イベントリスナー
    const startDateInput = modalElement.querySelector('#edit-start-date');
    const dueDateInput = modalElement.querySelector('#edit-due-date');
    const startDateDisplay = modalElement.querySelector('#edit-start-date-display');
    const dueDateDisplay = modalElement.querySelector('#edit-due-date-display');
    
    startDateInput.addEventListener('change', () => {
      startDateDisplay.textContent = startDateInput.value ? formatFullDate(startDateInput.value) : '';
    });
    
    dueDateInput.addEventListener('change', () => {
      dueDateDisplay.textContent = dueDateInput.value ? formatFullDate(dueDateInput.value) : '';
    });
    
    // 完了にするボタンのイベント
    const completeButton = modalElement.querySelector('#edit-complete-btn');
      completeButton.addEventListener('click', () => {
      const now = new Date().toISOString();
      
      // 担当者の情報を収集（プルダウンから選択された値を取得）
      const assignee1 = modalElement.querySelector('#edit-assignee1').value.trim();
      const assignee2 = modalElement.querySelector('#edit-assignee2').value.trim();
      const assignee3 = modalElement.querySelector('#edit-assignee3').value.trim();
      
      // 空でない担当者のみをカンマで結合
      const assigneeArray = [assignee1, assignee2, assignee3].filter(a => a);
      const assigneeValue = assigneeArray.length > 0 ? assigneeArray.join(',') : null;
      
      // カテゴリーと拠点の情報を取得
      const categorySelect = modalElement.querySelector('#edit-category');
      const officeSelect = modalElement.querySelector('#edit-office');
      
      const updatedTask = {
        id: task.id,
        title: modalElement.querySelector('#edit-title').value,
        description: modalElement.querySelector('#edit-description').value,
        category: categorySelect ? categorySelect.value : task.category,
        office: officeSelect ? officeSelect.value : task.office,
        status: STATUS.COMPLETED, // ステータスを完了に設定
        priority: modalElement.querySelector('#edit-priority').value,
        startDate: modalElement.querySelector('#edit-start-date').value || null,
        dueDate: modalElement.querySelector('#edit-due-date').value || null,
        assignee: assigneeValue,
        createdAt: task.createdAt || now,
        updatedAt: now
      };
      
      // タスクを削除して更新版を追加
      deleteTask(task.id);
      addTask(updatedTask);
      
      // モーダルを閉じる
      closeModal();
    });
    
    // フォーム送信処理
    const editForm = modalElement.querySelector('#edit-task-form');
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // 担当者の情報を収集して結合
      const assignee1 = editForm.querySelector('#edit-assignee1').value.trim();
      const assignee2 = editForm.querySelector('#edit-assignee2').value.trim();
      const assignee3 = editForm.querySelector('#edit-assignee3').value.trim();
      
      // 空でない担当者のみをカンマで結合
      const assigneeArray = [assignee1, assignee2, assignee3].filter(a => a);
      const assigneeValue = assigneeArray.length > 0 ? assigneeArray.join(',') : null;
      
      // カテゴリーと拠点の情報を取得
      const categorySelect = editForm.querySelector('#edit-category');
      const officeSelect = editForm.querySelector('#edit-office');
      
      const now = new Date().toISOString();
      const updatedTask = {
        id: task.id,
        title: editForm.querySelector('#edit-title').value,
        description: editForm.querySelector('#edit-description').value,
        category: categorySelect ? categorySelect.value : task.category,
        office: officeSelect ? officeSelect.value : task.office,
        status: editForm.querySelector('#edit-status').value,
        priority: editForm.querySelector('#edit-priority').value,
        startDate: editForm.querySelector('#edit-start-date').value || null,
        dueDate: editForm.querySelector('#edit-due-date').value || null,
        assignee: assigneeValue,
        createdAt: task.createdAt || now,
        updatedAt: now
      };
      
      // タスクを削除して更新版を追加
      deleteTask(task.id);
      addTask(updatedTask);
      
      // モーダルを閉じる
      closeModal();
    });
    
    // フォームの最初の入力フィールドにフォーカス
    setTimeout(() => {
      editForm.querySelector('#edit-title').focus();
    }, 100);
  };

  // フィルターボタンのカウントを更新
  const updateFilterCounts = () => {
    if (filterButtons.length >= 4) {
      filterButtons[0].querySelector('span').textContent = tasks.length;
      filterButtons[1].querySelector('span').textContent = tasks.filter(task => task.status === STATUS.TODO).length;
      filterButtons[2].querySelector('span').textContent = tasks.filter(task => task.status === STATUS.IN_PROGRESS).length;
      filterButtons[3].querySelector('span').textContent = tasks.filter(task => task.status === STATUS.COMPLETED).length;
    }
  };

  // 担当者別タスクを更新
  const updateAssigneeTasks = () => {
    if (!assigneeTasksContainer) return;
    
    // 担当者ごとにタスクをグループ化
    const assigneeGroups = {};
    
    tasks.forEach(task => {
      // 担当者がいない場合は「未割り当て」に分類
      if (!task.assignee) {
        if (!assigneeGroups['未割り当て']) {
          assigneeGroups['未割り当て'] = [];
        }
        assigneeGroups['未割り当て'].push(task);
      return;
    }
    
      // カンマ区切りの担当者を配列に分割
      const assignees = task.assignee.split(',').map(a => a.trim()).filter(a => a);
      
      // 各担当者にタスクを追加
      assignees.forEach(assignee => {
        if (!assigneeGroups[assignee]) {
          assigneeGroups[assignee] = [];
        }
        assigneeGroups[assignee].push(task);
      });
    });
    
    // 担当者別タスクを表示
    assigneeTasksContainer.innerHTML = '';
    Object.keys(assigneeGroups).forEach(assignee => {
      const tasksForAssignee = assigneeGroups[assignee];
      const todoTasks = tasksForAssignee.filter(task => task.status === STATUS.TODO);
      const inProgressTasks = tasksForAssignee.filter(task => task.status === STATUS.IN_PROGRESS);
      const completedTasks = tasksForAssignee.filter(task => task.status === STATUS.COMPLETED);
      const totalTasks = tasksForAssignee.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
      
      // 高優先度タスクをチェック
      const highPriorityTasks = tasksForAssignee.filter(task => 
        task.priority === PRIORITY.HIGH && task.status !== STATUS.COMPLETED
      );
      const hasHighPriorityTasks = highPriorityTasks.length > 0;
      
      const assigneeElement = document.createElement('div');
      assigneeElement.className = `assignee-group mb-2 p-2 rounded border transition-all duration-200 hover:shadow-sm relative group ${
        hasHighPriorityTasks 
          ? 'bg-red-50 border-red-200 hover:bg-red-100' 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`;
      
      // タスク詳細（ホバー時に表示）
      const taskDetails = tasksForAssignee.map(task => {
        let priorityClass = 'text-green-600';
        if (task.priority === PRIORITY.HIGH) {
          priorityClass = 'text-red-600';
        } else if (task.priority === PRIORITY.MEDIUM) {
          priorityClass = 'text-yellow-600';
        }
        
        let statusClass = 'text-blue-600';
        if (task.status === STATUS.TODO) {
          statusClass = 'text-yellow-600';
        } else if (task.status === STATUS.COMPLETED) {
          statusClass = 'text-green-600';
        }
        
        let dueDateText = '期限なし';
        if (task.dueDate) {
          const daysRemaining = getDaysRemaining(task.dueDate);
          if (daysRemaining < 0) {
            dueDateText = `<span class="text-red-600">${formatDate(task.dueDate)} (${Math.abs(daysRemaining)}日超過)</span>`;
          } else if (daysRemaining === 0) {
            dueDateText = `<span class="text-yellow-600">${formatDate(task.dueDate)} (今日期限)</span>`;
          } else {
            dueDateText = `${formatDate(task.dueDate)} (あと${daysRemaining}日)`;
          }
        }
        
        // すべての担当者を表示（現在の担当者を強調）
        let assigneeText = '担当者なし';
        if (task.assignee) {
          const allAssignees = task.assignee.split(',').map(a => a.trim()).filter(a => a);
          assigneeText = allAssignees.map(a => 
            a === assignee ? 
            `<span class="font-medium text-blue-600">${a}</span>` : a
          ).join(', ');
        }
      
              return `
          <div class="mb-2 pb-2 border-b border-gray-200 last:border-0">
            <div class="font-semibold">${task.title}</div>
            ${task.description ? `<div class="text-xs text-gray-600 mb-1">${task.description}</div>` : ''}
            <div class="text-xs ${statusClass}">ステータス: ${getStatusText(task.status)}</div>
            <div class="text-xs ${priorityClass}">優先度: ${getPriorityText(task.priority)}</div>
            <div class="text-xs">担当: ${assigneeText}</div>
            <div class="text-xs">期限: ${dueDateText}</div>
                </div>
              `;
      }).join('');
      
      const hoverDetails = `
        <div class="tooltip-content">
          <div class="font-bold mb-2 border-b border-gray-200 pb-1">
            ${assignee}のタスク一覧 (${totalTasks}件)
            </div>
          <div class="max-h-60 overflow-y-auto pr-1">
            ${taskDetails}
          </div>
        </div>
      `;
      
      assigneeElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center">
            <div class="w-6 h-6 rounded-full ${hasHighPriorityTasks ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-xs font-semibold text-gray-800 truncate">${assignee}</h4>
              <span class="text-2xs text-gray-500">${totalTasks}件</span>
            </div>
          </div>
          <div class="text-right ml-2">
            <div class="text-sm font-bold ${hasHighPriorityTasks ? 'text-red-600' : 'text-blue-600'}">${completionRate}%</div>
            <div class="text-2xs text-gray-500 leading-tight">完了</div>
          </div>
        </div>
        
        ${hasHighPriorityTasks ? `
        <div class="mb-2 p-1.5 bg-red-100 border border-red-300 rounded">
          <div class="flex items-center text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-2xs font-medium">高優先度 ${highPriorityTasks.length}件</span>
          </div>
        </div>
        ` : ''}
        
        <div class="flex justify-between items-center">
          <div class="flex space-x-2">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 mr-0.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              <span class="text-2xs text-gray-700">${todoTasks.length}</span>
            </div>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 mr-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-2xs text-gray-700">${inProgressTasks.length}</span>
            </div>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5 mr-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-2xs text-gray-700">${completedTasks.length}</span>
            </div>
          </div>
          <div class="w-16 bg-gray-200 rounded-full h-1.5">
            <div class="${hasHighPriorityTasks ? 'bg-red-500' : 'bg-blue-500'} h-1.5 rounded-full transition-all duration-300" style="width: ${completionRate}%"></div>
          </div>
        </div>
      `;
      
      // ホバーイベントの設定
      assigneeElement.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-50 bg-white rounded-md shadow-lg p-3 text-left text-xs border';
        tooltip.style.bottom = 'auto';
        tooltip.style.top = (e.clientY) + 'px';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.position = 'fixed';
        tooltip.style.minWidth = '250px';
        tooltip.style.maxWidth = '300px';
        tooltip.style.zIndex = '9999';
        tooltip.style.borderTop = hasHighPriorityTasks ? '3px solid #EF4444' : '3px solid #3B82F6';
        tooltip.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        tooltip.innerHTML = hoverDetails;
        
        document.body.appendChild(tooltip);
        assigneeElement._tooltip = tooltip;
      });
      
      assigneeElement.addEventListener('mouseleave', () => {
        if (assigneeElement._tooltip) {
          assigneeElement._tooltip.remove();
          assigneeElement._tooltip = null;
        }
      });
      
      assigneeTasksContainer.appendChild(assigneeElement);
    });
  };
  
  // 今週のタスクを更新
  const updateWeeklyTasks = () => {
    if (!weeklyTasksContainer) return;
    
    // 今週の日付範囲を計算
    const today = new Date();
    const currentDay = today.getDay(); // 0:日曜日, 1:月曜日, ...
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay); // 今週の日曜日
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 今週の土曜日
    endOfWeek.setHours(23, 59, 59, 999);
    
    // 今週期限のタスクを取得
    const weeklyTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    });
    
    // 日付順にソート
    weeklyTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // 今日の予定タスクを取得
    const todayTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === todayDate.getTime();
    });
    
    // 今日の予定タスクを表示（todayTasksContainerがある場合）
    if (document.getElementById('today-tasks')) {
      const todayTasksContainer = document.getElementById('today-tasks');
      todayTasksContainer.innerHTML = '';
      
      if (todayTasks.length === 0) {
        todayTasksContainer.innerHTML = '<div class="text-xs text-gray-500 p-2">本日の予定タスクはありません</div>';
      } else {
        todayTasks.forEach(task => {
          const isOverdue = getDaysRemaining(task.dueDate) < 0;
          
          // タスクの優先度に基づいた色分け
          let priorityBorderClass = 'border-green-400';
          if (task.priority === PRIORITY.HIGH) {
            priorityBorderClass = 'border-red-400';
          } else if (task.priority === PRIORITY.MEDIUM) {
            priorityBorderClass = 'border-yellow-400';
          }
          
          // ステータスに基づいた色分け
          let statusClass = '';
          if (task.status === STATUS.COMPLETED) {
            statusClass = 'line-through opacity-60';
          } else if (isOverdue) {
            statusClass = 'text-red-600';
          }
          
          // 担当者情報を取得
          const assignees = task.assignee ? task.assignee.split(',').map(a => a.trim()).filter(a => a) : [];
          let assigneeText = assignees.length > 0 ? assignees.join(', ') : '担当者なし';
          
          const todayElement = document.createElement('div');
          todayElement.className = `p-2 mb-1 rounded border-l-2 ${priorityBorderClass} hover:bg-gray-50 relative group`;
          
          // タスク詳細（ホバー時に表示）
          const hoverDetails = `
            <div class="tooltip-content">
              <div class="font-semibold mb-1">${task.title}</div>
              ${task.description ? `<div class="text-xs text-gray-600 mb-1">${task.description}</div>` : ''}
              <div class="text-xs">期限: ${formatDate(task.dueDate)}</div>
              <div class="text-xs">ステータス: ${getStatusText(task.status)}</div>
              <div class="text-xs">優先度: ${getPriorityText(task.priority)}</div>
              <div class="text-xs">担当: ${assigneeText}</div>
        </div>
      `;
          
          todayElement.innerHTML = `
            <div class="flex justify-between items-center">
              <h4 class="text-sm ${statusClass} truncate max-w-[170px]" title="${task.title}">${task.title}</h4>
              <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1 text-gray-500 hover:text-blue-600 edit-today-task" title="編集" data-task-id="${task.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                </button>
                <button class="p-1 text-gray-500 hover:text-red-600 delete-today-task" title="削除" data-task-id="${task.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
        </div>
      `;
          
          // ホバーイベントの設定
          todayElement.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute z-50 bg-white rounded-md shadow-lg p-3 text-left text-xs';
            tooltip.style.bottom = 'auto';
            tooltip.style.top = (e.clientY + 10) + 'px';
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.position = 'fixed';
            tooltip.style.minWidth = '200px';
            tooltip.style.maxWidth = '250px';
            tooltip.style.zIndex = '9999';
            tooltip.style.borderTop = `2px solid ${
              task.priority === PRIORITY.HIGH ? '#EF4444' : 
              task.priority === PRIORITY.MEDIUM ? '#F59E0B' : '#10B981'
            }`;
            tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            tooltip.innerHTML = hoverDetails;
            
            document.body.appendChild(tooltip);
            todayElement._tooltip = tooltip;
          });
          
          todayElement.addEventListener('mouseleave', () => {
            if (todayElement._tooltip) {
              todayElement._tooltip.remove();
              todayElement._tooltip = null;
            }
          });
          
          // 編集ボタンのイベントリスナー
          todayElement.querySelector('.edit-today-task').addEventListener('click', () => {
            editTask(task);
          });
          
          // 削除ボタンのイベントリスナー
          todayElement.querySelector('.delete-today-task').addEventListener('click', () => {
            if (confirm('このタスクを削除してもよろしいですか？')) {
              deleteTask(task.id);
            }
          });
          
          todayTasksContainer.appendChild(todayElement);
        });
      }
    }
    
    // 今週のタスクを表示
    weeklyTasksContainer.innerHTML = '';
    if (weeklyTasks.length === 0) {
      weeklyTasksContainer.innerHTML = '<div class="text-xs text-gray-500 p-2">今週期限のタスクはありません</div>';
    } else {
      weeklyTasks.forEach(task => {
        const daysRemaining = getDaysRemaining(task.dueDate);
        const isOverdue = daysRemaining < 0;
        const isToday = daysRemaining === 0;
        
        // 既に今日のタスクとして表示されている場合はスキップ
        if (isToday && document.getElementById('today-tasks')) {
      return;
    }
    
        // タスクの優先度に基づいた色分け
        let priorityBorderClass = 'border-green-400';
        if (task.priority === PRIORITY.HIGH) {
          priorityBorderClass = 'border-red-400';
        } else if (task.priority === PRIORITY.MEDIUM) {
          priorityBorderClass = 'border-yellow-400';
        }
        
        // ステータスに基づいた色分け
        let statusClass = '';
        if (task.status === STATUS.COMPLETED) {
          statusClass = 'line-through opacity-60';
        } else if (isOverdue) {
          statusClass = 'text-red-600';
        }
        
        // 担当者情報を取得
        const assignees = task.assignee ? task.assignee.split(',').map(a => a.trim()).filter(a => a) : [];
        let assigneeText = assignees.length > 0 ? assignees.join(', ') : '担当者なし';
        
        const weeklyElement = document.createElement('div');
        weeklyElement.className = `p-2 mb-1 rounded border-l-2 ${priorityBorderClass} hover:bg-gray-50 relative group`;
        
        // タスク詳細（ホバー時に表示）
        const hoverDetails = `
          <div class="tooltip-content">
            <div class="font-semibold mb-1">${task.title}</div>
            ${task.description ? `<div class="text-xs text-gray-600 mb-1">${task.description}</div>` : ''}
            <div class="text-xs">期限: ${formatDate(task.dueDate)} ${
              daysRemaining === 0 ? '(今日)' : 
              daysRemaining > 0 ? `(あと${daysRemaining}日)` : 
              `(${Math.abs(daysRemaining)}日超過)`
            }</div>
            <div class="text-xs">ステータス: ${getStatusText(task.status)}</div>
            <div class="text-xs">優先度: ${getPriorityText(task.priority)}</div>
            <div class="text-xs">担当: ${assigneeText}</div>
          </div>
        `;
        
        weeklyElement.innerHTML = `
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2 max-w-[170px]">
              <span class="text-xs text-gray-500">${formatDate(task.dueDate).split('(')[0]}</span>
              <h4 class="text-sm ${statusClass} truncate" title="${task.title}">${task.title}</h4>
            </div>
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="p-1 text-gray-500 hover:text-blue-600 edit-weekly-task" title="編集" data-task-id="${task.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button class="p-1 text-gray-500 hover:text-red-600 delete-weekly-task" title="削除" data-task-id="${task.id}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
        </div>
      `;
        
        // ホバーイベントの設定
        weeklyElement.addEventListener('mouseenter', (e) => {
          const tooltip = document.createElement('div');
          tooltip.className = 'absolute z-50 bg-white rounded-md shadow-lg p-3 text-left text-xs';
          tooltip.style.bottom = 'auto';
          tooltip.style.top = (e.clientY + 10) + 'px';
          tooltip.style.left = (e.clientX + 10) + 'px';
          tooltip.style.position = 'fixed';
          tooltip.style.minWidth = '200px';
          tooltip.style.maxWidth = '250px';
          tooltip.style.zIndex = '9999';
          tooltip.style.borderTop = `2px solid ${
            task.priority === PRIORITY.HIGH ? '#EF4444' : 
            task.priority === PRIORITY.MEDIUM ? '#F59E0B' : '#10B981'
          }`;
          tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
          tooltip.innerHTML = hoverDetails;
          
          document.body.appendChild(tooltip);
          weeklyElement._tooltip = tooltip;
        });
        
        weeklyElement.addEventListener('mouseleave', () => {
          if (weeklyElement._tooltip) {
            weeklyElement._tooltip.remove();
            weeklyElement._tooltip = null;
          }
        });
        
        // 編集ボタンのイベントリスナー
        weeklyElement.querySelector('.edit-weekly-task').addEventListener('click', () => {
          editTask(task);
        });
        
        // 削除ボタンのイベントリスナー
        weeklyElement.querySelector('.delete-weekly-task').addEventListener('click', () => {
          if (confirm('このタスクを削除してもよろしいですか？')) {
            deleteTask(task.id);
          }
        });
        
        weeklyTasksContainer.appendChild(weeklyElement);
      });
    }
  };

  // 統計を更新
  const updateStatistics = () => {
    if (completionRateElement) {
      const completedTasks = tasks.filter(task => task.status === STATUS.COMPLETED);
      const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
      completionRateElement.textContent = `${completionRate}%`;
      
      // CSS変数を更新
      document.documentElement.style.setProperty('--completion-rate', `${completionRate}%`);
    }
    
    if (pendingTasksElement) {
      const pendingTasks = tasks.filter(task => task.status !== STATUS.COMPLETED);
      pendingTasksElement.textContent = pendingTasks.length;
      
      // CSS変数を更新
      const pendingRate = tasks.length > 0 ? Math.round((pendingTasks.length / tasks.length) * 100) : 0;
      document.documentElement.style.setProperty('--pending-rate', `${pendingRate}%`);
    }
    
    if (todoCountElement) {
      const todoTasks = tasks.filter(task => task.status === STATUS.TODO);
      todoCountElement.textContent = todoTasks.length;
    }
    
    if (inProgressCountElement) {
      const inProgressTasks = tasks.filter(task => task.status === STATUS.IN_PROGRESS);
      inProgressCountElement.textContent = inProgressTasks.length;
    }
    
    if (completedCountElement) {
      const completedTasks = tasks.filter(task => task.status === STATUS.COMPLETED);
      completedCountElement.textContent = completedTasks.length;
    }
    
    // 期限切れタスクの更新
    if (overdueTasksContainer) {
    const now = new Date();
      const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === STATUS.COMPLETED) return false;
      const dueDate = new Date(task.dueDate);
        return dueDate < now;
      });
      
      const overdueCountElement = document.getElementById('overdue-tasks-count');
      if (overdueCountElement) {
        overdueCountElement.textContent = overdueTasks.length;
      }
      
      // CSS変数を更新
      const overdueRate = tasks.length > 0 ? Math.round((overdueTasks.length / tasks.length) * 100) : 0;
      document.documentElement.style.setProperty('--overdue-rate', `${overdueRate}%`);
      
      // 期限切れタスクの詳細一覧を表示
      overdueTasksContainer.innerHTML = '';
      if (overdueTasks.length === 0) {
        overdueTasksContainer.innerHTML = '<div class="text-xs text-gray-500 p-2">期限切れのタスクはありません</div>';
      } else {
        overdueTasks.forEach(task => {
          const daysOverdue = Math.abs(getDaysRemaining(task.dueDate));
          
          // タスクの優先度に基づいた色分け
          let priorityBorderClass = 'border-green-400';
          if (task.priority === PRIORITY.HIGH) {
            priorityBorderClass = 'border-red-400';
          } else if (task.priority === PRIORITY.MEDIUM) {
            priorityBorderClass = 'border-yellow-400';
          }
          
          // 担当者情報を取得
          const assignees = task.assignee ? task.assignee.split(',').map(a => a.trim()).filter(a => a) : [];
          let assigneeText = assignees.length > 0 ? assignees.join(', ') : '担当者なし';
          
          const overdueElement = document.createElement('div');
          overdueElement.className = `p-2 mb-1 rounded border-l-2 ${priorityBorderClass} hover:bg-gray-50 relative group`;
          
          // タスク詳細（ホバー時に表示）
          const hoverDetails = `
            <div class="tooltip-content">
              <div class="font-semibold mb-1">${task.title}</div>
              ${task.description ? `<div class="text-xs text-gray-600 mb-1">${task.description}</div>` : ''}
              <div class="text-xs text-red-600">期限: ${formatDate(task.dueDate)} (${daysOverdue}日超過)</div>
              <div class="text-xs">ステータス: ${getStatusText(task.status)}</div>
              <div class="text-xs">優先度: ${getPriorityText(task.priority)}</div>
              <div class="text-xs">担当: ${assigneeText}</div>
              </div>
          `;
          
          overdueElement.innerHTML = `
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-2 max-w-[170px]">
                <span class="text-xs text-red-500">${daysOverdue}日超過</span>
                <h4 class="text-sm text-red-600 truncate" title="${task.title}">${task.title}</h4>
            </div>
              <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1 text-gray-500 hover:text-blue-600 edit-overdue-task" title="編集" data-task-id="${task.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
                </button>
                <button class="p-1 text-gray-500 hover:text-red-600 delete-overdue-task" title="削除" data-task-id="${task.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
            </div>
          </div>
    `;
    
          // ホバーイベントの設定
          overdueElement.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute z-50 bg-white rounded-md shadow-lg p-3 text-left text-xs';
            tooltip.style.bottom = 'auto';
            tooltip.style.top = (e.clientY + 10) + 'px';
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.position = 'fixed';
            tooltip.style.minWidth = '200px';
            tooltip.style.maxWidth = '250px';
            tooltip.style.zIndex = '9999';
            tooltip.style.borderTop = '2px solid #EF4444';
            tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            tooltip.innerHTML = hoverDetails;
            
            document.body.appendChild(tooltip);
            overdueElement._tooltip = tooltip;
          });
          
          overdueElement.addEventListener('mouseleave', () => {
            if (overdueElement._tooltip) {
              overdueElement._tooltip.remove();
              overdueElement._tooltip = null;
            }
          });
          
          // 編集ボタンのイベントリスナー
          overdueElement.querySelector('.edit-overdue-task').addEventListener('click', () => {
            editTask(task);
          });
          
          // 削除ボタンのイベントリスナー
          overdueElement.querySelector('.delete-overdue-task').addEventListener('click', () => {
            if (confirm('このタスクを削除してもよろしいですか？')) {
              deleteTask(task.id);
            }
          });
          
          overdueTasksContainer.appendChild(overdueElement);
        });
      }
    }
    
    // 進捗グラフを更新
    updateProgressChart();
    
    // 期限日タイムラインを更新
    updateDueDateTimeline();
  };

  // 進捗グラフを初期化
  const initProgressChart = () => {
    if (!progressChartCanvas) return;
    
    // グラフデータを取得
    const todoCount = tasks.filter(task => task.status === STATUS.TODO).length;
    const inProgressCount = tasks.filter(task => task.status === STATUS.IN_PROGRESS).length;
    const completedCount = tasks.filter(task => task.status === STATUS.COMPLETED).length;
    
    // 完了率を表示
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    if (progressPercentageElement) {
      progressPercentageElement.textContent = `${completionRate}%`;
    }
    
    // すでにグラフが存在する場合は破棄
    if (progressChart) {
      progressChart.destroy();
    }
    
    // グラフを作成
    progressChart = new Chart(progressChartCanvas, {
      type: 'doughnut',
      data: {
        labels: ['未着手', '進行中', '完了'],
        datasets: [{
          data: [todoCount, inProgressCount, completedCount],
          backgroundColor: [
            'rgba(255, 206, 86, 0.7)',  // 黄色 - 未着手
            'rgba(54, 162, 235, 0.7)',  // 青色 - 進行中
            'rgba(75, 192, 192, 0.7)'   // 緑色 - 完了
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.formattedValue;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((context.raw / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  };

  // 進捗グラフを更新
  const updateProgressChart = () => {
    if (!progressChart) {
      initProgressChart();
      return;
    }
    
    // グラフデータを更新
    const todoCount = tasks.filter(task => task.status === STATUS.TODO).length;
    const inProgressCount = tasks.filter(task => task.status === STATUS.IN_PROGRESS).length;
    const completedCount = tasks.filter(task => task.status === STATUS.COMPLETED).length;
    
    progressChart.data.datasets[0].data = [todoCount, inProgressCount, completedCount];
    progressChart.update();
    
    // 完了率を更新
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    if (progressPercentageElement) {
      progressPercentageElement.textContent = `${completionRate}%`;
    }
  };

  // タブ切り替え機能
  const initTabs = () => {
    console.log('タブ初期化関数が呼び出されました');
    console.log('タブ要素:', tabs.length);
    console.log('タブコンテンツ要素:', tabContents.length);

    tabs.forEach((tab, index) => {
      console.log(`タブ${index}:`, tab.dataset.tab);
      
      tab.addEventListener('click', () => {
        console.log(`タブがクリックされました: ${tab.dataset.tab}`);
        // アクティブなタブを切り替え
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // タブコンテンツを切り替え
        const tabId = tab.dataset.tab;
        console.log(`タブID: ${tabId}`);
        
        tabContents.forEach((content, i) => {
          console.log(`コンテンツ${i} ID:`, content.id);
          content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`${tabId}-content`);
        console.log(`ターゲットコンテンツ: ${targetContent ? targetContent.id : 'null'}`);
        
        if (targetContent) {
          targetContent.classList.add('active');
          console.log(`${tabId}-content にactiveクラスを追加しました`);
        } else {
          console.error(`エラー: ${tabId}-content という要素が見つかりません`);
        }
        
        // カレンダータブが選択された場合、カレンダーを更新
        if (tabId === 'calendar') {
          console.log('カレンダータブが選択されました。カレンダーを更新します。');
          setTimeout(() => updateCalendar(), 100);
        }
      });
    });
    
    // デバッグ用：ページ読み込み時に自動的にカレンダータブを表示
    setTimeout(() => {
      // カレンダータブをクリック
      const calendarTab = document.querySelector('[data-tab="calendar"]');
      if (calendarTab) {
        console.log('カレンダータブを自動的に選択します');
        calendarTab.click();
      }
    }, 500);
  };

  // 日付を 'YYYY-MM-DD' 形式に変換（比較用）
  const formatDateForComparison = (date) => {
    try {
      if (!(date instanceof Date)) {
        console.error('formatDateForComparison: 日付オブジェクトではありません', date);
        return '';
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log(`日付変換: ${date} => ${result}`);
      return result;
    } catch (error) {
      console.error('formatDateForComparison エラー:', error);
      return '';
    }
  };

  // カレンダーの更新
  const updateCalendar = () => {
    if (!calendarDays || !calendarTitle) {
      console.error('カレンダー要素が見つかりません: calendarDays=', calendarDays, 'calendarTitle=', calendarTitle);
      return;
    }
    
    console.log('カレンダーを更新します');
    console.log('現在のタスク数:', tasks.length);
    
    // タイトルを更新
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth() + 1;
    calendarTitle.textContent = `${year}年${month}月`;
    
    // 月の最初の日を取得
    const firstDay = new Date(year, month - 1, 1);
    // 月の最後の日を取得
    const lastDay = new Date(year, month, 0);
    // 月の最初の日の曜日を取得（0:日曜日, 1:月曜日, ...)
    const firstDayOfWeek = firstDay.getDay();
    // 月の日数を取得
    const daysInMonth = lastDay.getDate();
    
    // 前月の最後の日を取得
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    
    // カレンダーをクリア
    console.log('カレンダーをクリアします');
    calendarDays.innerHTML = '';
    
    // カレンダーの日付を生成
    let calendarHTML = '';
    
    // 前月の日付を追加
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = prevMonthLastDay - firstDayOfWeek + i + 1;
      const prevMonthDate = new Date(year, month - 2, day);
      const dayOfWeek = prevMonthDate.getDay();
      
      // 曜日に応じた色を設定
      let dayTextClass = '';
      if (dayOfWeek === 0) { // 日曜日
        dayTextClass = 'text-red-300';
      } else if (dayOfWeek === 6) { // 土曜日
        dayTextClass = 'text-blue-300';
      }
      
      calendarHTML += `
        <div class="calendar-day outside-month p-2 border border-gray-200 hover:shadow-md hover:scale-102 transition-all duration-200">
          <div class="text-sm text-gray-400 ${dayTextClass}">${day}</div>
          <div class="calendar-events mt-1"></div>
        </div>
      `;
    }
    
    // 当月の日付を追加
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      date.setHours(0, 0, 0, 0);
      
      const isToday = date.getTime() === today.getTime();
      const dayClass = isToday ? 'calendar-day today bg-blue-50 p-2 border border-blue-300' : 'calendar-day p-2 border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200';
      
      // 曜日に応じた色を設定
      const dayOfWeek = date.getDay();
      let dayTextClass = '';
      if (dayOfWeek === 0) { // 日曜日
        dayTextClass = 'text-red-500';
      } else if (dayOfWeek === 6) { // 土曜日
        dayTextClass = 'text-blue-500';
      }
      
      // 各日のセルを作成（タスクは後から追加）
      calendarHTML += `
        <div class="${dayClass}" data-date="${formatDateForComparison(date)}">
          <div class="flex items-center justify-between text-sm font-medium ${isToday ? 'text-blue-700' : dayTextClass}">
            <span>${i}</span>
            <button class="add-task-btn group relative w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all duration-300 transform hover:scale-125" 
                    title="タスクを追加" data-date="${formatDateForComparison(date)}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 transition-all duration-300 group-hover:rotate-180">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/>
              </svg>
            </button>
          </div>
          <div class="calendar-events mt-1 space-y-1"></div>
        </div>
      `;
    }
    
    // 翌月の日付を追加（行を揃えるために必要な分だけ）
    const totalDays = firstDayOfWeek + daysInMonth;
    const rowsNeeded = Math.ceil(totalDays / 7); // 必要な行数
    const cellsNeeded = rowsNeeded * 7; // 必要なセル数
    const remainingDays = cellsNeeded - totalDays; // 残りのセル
    
    console.log(`カレンダー情報: 行数=${rowsNeeded}, 総セル数=${cellsNeeded}, 残りセル数=${remainingDays}`);
    
    // 翌月の日付を追加
    for (let i = 1; i <= remainingDays; i++) {
      // 翌月の日付の曜日を計算
      const nextMonthDate = new Date(year, month, i);
      const dayOfWeek = nextMonthDate.getDay();
      
      // 曜日に応じた色を設定
      let dayTextClass = '';
      if (dayOfWeek === 0) { // 日曜日
        dayTextClass = 'text-red-300';
      } else if (dayOfWeek === 6) { // 土曜日
        dayTextClass = 'text-blue-300';
      }
      
      calendarHTML += `
        <div class="calendar-day outside-month p-2 border border-gray-200 hover:shadow-md hover:scale-102 transition-all duration-200">
          <div class="text-sm text-gray-400 ${dayTextClass}">${i}</div>
          <div class="calendar-events mt-1"></div>
        </div>
      `;
    }
    
    // HTML文字列をDOMに追加
    console.log('カレンダーHTMLを設定します');
    calendarDays.innerHTML = calendarHTML;
    
    // カレンダーコンテナを上にスクロール
    const calendarContainer = document.querySelector('.calendar-grid-container');
    if (calendarContainer) {
      calendarContainer.scrollTop = 0;
    }
    
    // 各日の日付文字列をコンソールに出力（デバッグ用）
    const dateStrings = [];
    document.querySelectorAll('.calendar-day[data-date]').forEach(cell => {
      dateStrings.push(cell.getAttribute('data-date'));
    });
    console.log('カレンダーの日付:', dateStrings);
    
    console.log('タスクをカレンダーに表示します');
    console.log('現在のタスクデータ:', tasks);
    console.log('表示対象年月:', year, month);
    
    // すべてのタスクをカレンダーに表示する
    const calendarCells = document.querySelectorAll('.calendar-day');
    console.log(`カレンダーセルの数: ${calendarCells.length}`);
    
    calendarCells.forEach(cell => {
      const dateAttr = cell.getAttribute('data-date');
      if (!dateAttr) {
        console.warn('data-date属性がないセルをスキップします');
        return;
      }
      
      const cellDate = new Date(dateAttr);
      if (isNaN(cellDate.getTime())) {
        console.warn(`無効な日付のセルをスキップします: ${dateAttr}`);
        return;
      }
      
      // イベントコンテナを取得
      const eventsContainer = cell.querySelector('.calendar-events');
      if (!eventsContainer) {
        console.warn('イベントコンテナが見つかりません');
        return;
      }
      
      // この日付に関連するすべてのタスクを取得
      const dayTasks = tasks.filter(task => {
        // 無効なタスクをスキップ
        if (!task || (!task.startDate && !task.dueDate)) {
          return false;
        }

        // cellDateの時間を00:00:00にリセット
        const normalizedCellDate = new Date(cellDate);
        normalizedCellDate.setHours(0, 0, 0, 0);

        // 期間タスク（開始日と終了日があるタスク）
        if (task.startDate && task.dueDate) {
          const startDate = new Date(task.startDate);
          const endDate = new Date(task.dueDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);
          
          const isInRange = normalizedCellDate.getTime() >= startDate.getTime() && normalizedCellDate.getTime() <= endDate.getTime();
          if (isInRange) {
            console.log(`✅ タスク「${task.title}」を日付 ${dateAttr} に表示 (期間: ${task.startDate} 〜 ${task.dueDate})`);
          }
          return isInRange;
        }
        
        // 終了日のみのタスク
        if (task.dueDate && !task.startDate) {
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          const isMatch = taskDate.getTime() === normalizedCellDate.getTime();
          if (isMatch) {
            console.log(`✅ タスク「${task.title}」を日付 ${dateAttr} に表示 (終了日: ${task.dueDate})`);
          }
          return isMatch;
        }
        
        // 開始日のみのタスク
        if (task.startDate && !task.dueDate) {
          const taskDate = new Date(task.startDate);
          taskDate.setHours(0, 0, 0, 0);
          const isMatch = taskDate.getTime() === normalizedCellDate.getTime();
          if (isMatch) {
            console.log(`✅ タスク「${task.title}」を日付 ${dateAttr} に表示 (開始日: ${task.startDate})`);
          }
          return isMatch;
        }
        
        return false;
      });
      
      if (dayTasks.length > 0) {
        console.log(`日付 ${dateAttr} のタスク数: ${dayTasks.length}`);
      }
      
      // タスクを表示（優先度順にソート）
      dayTasks
        .sort((a, b) => {
          // 優先度でソート（高 → 中 → 低）
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .forEach(task => {
          const taskEl = document.createElement('div');
          
          // 優先度に基づくクラス
          let priorityClass = 'priority-low';
          if (task.priority === PRIORITY.HIGH) {
            priorityClass = 'priority-high';
          } else if (task.priority === PRIORITY.MEDIUM) {
            priorityClass = 'priority-medium';
          }
          
          // 完了状態に基づくクラス
          let completedClass = '';
          if (task.status === STATUS.COMPLETED) {
            completedClass = 'completed';
          }
          
          taskEl.className = `calendar-event ${priorityClass} ${completedClass}`;
          
          // ステータスアイコンを追加
          let statusIcon = '';
          if (task.status === STATUS.TODO) {
            statusIcon = '⏳ ';
          } else if (task.status === STATUS.IN_PROGRESS) {
            statusIcon = '🔄 ';
          } else if (task.status === STATUS.COMPLETED) {
            statusIcon = '✅ ';
          }
          
          // ツールチップ用の詳細情報を作成
          const assignees = task.assignee ? task.assignee.split(',').map(a => a.trim()).filter(a => a) : [];
          const assigneeText = assignees.length > 0 ? assignees.join(', ') : '担当者なし';
          
          const tooltipData = {
            title: task.title,
            description: task.description || '',
            priority: getPriorityText(task.priority),
            status: getStatusText(task.status),
            assignees: assigneeText,
            startDate: task.startDate ? formatDate(task.startDate) : '',
            dueDate: task.dueDate ? formatDate(task.dueDate) : ''
          };
          
          // データ属性として設定
          Object.keys(tooltipData).forEach(key => {
            taskEl.setAttribute(`data-${key}`, tooltipData[key]);
          });
          
          // アイコンとタイトルを設定
          if (task.title.length > 15) {
            taskEl.textContent = statusIcon + task.title.substring(0, 15) + '...';
          } else {
            taskEl.textContent = statusIcon + task.title;
          }
          
          // ホバー時のツールチップ機能
          taskEl.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'calendar-tooltip show';
            
            // 担当者リストを整形
            const assigneesList = assignees.length > 0 
              ? assignees.map(name => `<span class="tooltip-assignee">${name}</span>`).join('')
              : '<span class="tooltip-assignee">担当者なし</span>';
            
            tooltip.innerHTML = `
              <div class="tooltip-header">
                <div class="tooltip-title">${tooltipData.title}</div>
                ${tooltipData.description ? `<div class="tooltip-description">${tooltipData.description}</div>` : ''}
              </div>
              
              <div class="tooltip-badges">
                <span class="tooltip-badge priority-${task.priority}">${tooltipData.priority}</span>
                <span class="tooltip-badge status-${task.status.replace('-', '-')}">${tooltipData.status}</span>
              </div>
              
              <div class="tooltip-section">
                <div class="tooltip-label">担当者</div>
                <div class="tooltip-assignees">${assigneesList}</div>
              </div>
              
              ${tooltipData.startDate || tooltipData.dueDate ? `
                <div class="tooltip-dates">
                  ${tooltipData.startDate ? `
                    <div class="tooltip-date">
                      <div class="tooltip-date-label">開始日</div>
                      <div class="tooltip-date-value">${tooltipData.startDate}</div>
                    </div>
                  ` : ''}
                  ${tooltipData.dueDate ? `
                    <div class="tooltip-date">
                      <div class="tooltip-date-label">期限日</div>
                      <div class="tooltip-date-value">${tooltipData.dueDate}</div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            `;
            
            // スタイルを設定
            tooltip.style.position = 'absolute';
            tooltip.style.zIndex = '1000';
            tooltip.style.pointerEvents = 'none';
            
            document.body.appendChild(tooltip);
            
            // 位置を調整
            const rect = taskEl.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // 初期位置設定
            let left = rect.left + scrollX;
            let top = rect.bottom + scrollY + 12;
            
            // ツールチップのサイズを取得
            const tooltipRect = tooltip.getBoundingClientRect();
            
            // 右端から外れる場合は左に移動
            if (left + tooltipRect.width > window.innerWidth) {
              left = window.innerWidth - tooltipRect.width - 10;
              taskEl.classList.add('position-right');
            }
            
            // 下端から外れる場合は上に移動
            if (top + tooltipRect.height > window.innerHeight + scrollY) {
              top = rect.top + scrollY - tooltipRect.height - 12;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            
            // アニメーション開始
            setTimeout(() => {
              tooltip.classList.add('show');
            }, 10);
            
            taskEl._tooltip = tooltip;
          });
          
          taskEl.addEventListener('mouseleave', function() {
            if (taskEl._tooltip) {
              taskEl._tooltip.remove();
              taskEl._tooltip = null;
            }
          });
          
          // タスクのクリックイベント
          taskEl.addEventListener('click', (e) => {
            e.stopPropagation();
            editTask(task);
          });
          
          eventsContainer.appendChild(taskEl);
        });
      
      // タスクが多い場合の表示
      if (dayTasks.length > 3) {
        const moreEl = document.createElement('div');
        moreEl.className = 'text-xs text-gray-500 text-center';
        moreEl.textContent = `+${dayTasks.length - 3}件`;
        eventsContainer.appendChild(moreEl);
      }
    });
    
    // プラスボタンのクリックイベントを追加
    document.querySelectorAll('.add-task-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = button.getAttribute('data-date');
        createTaskModal(date);
      });
    });
    
    // カレンダーセルのホバー効果を強化
    document.querySelectorAll('.calendar-day').forEach(cell => {
      if (!cell.classList.contains('outside-month')) {
        // ホバー時の効果
        cell.addEventListener('mouseenter', function() {
          if (!this.style.transform || this.style.transform === '') {
            this.style.transform = 'translateY(-2px) scale(1.02)';
            this.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
            this.style.borderColor = '#3b82f6';
            this.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
            this.style.transition = 'all 0.2s ease';
            this.style.zIndex = '5';
          }
        });
        
        cell.addEventListener('mouseleave', function() {
          this.style.transform = '';
          this.style.boxShadow = '';
          this.style.borderColor = '';
          this.style.background = '';
          this.style.zIndex = '';
        });
      }
    });
    
    console.log('カレンダー更新が完了しました');
  };

  // UUIDを生成
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // フォーム送信イベント
  if (taskForm) {
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 担当者の情報を収集（プルダウンから選択された値を取得）
    const assignee1 = document.getElementById('assignee1') ? document.getElementById('assignee1').value.trim() : '';
    const assignee2 = document.getElementById('assignee2') ? document.getElementById('assignee2').value.trim() : '';
    const assignee3 = document.getElementById('assignee3') ? document.getElementById('assignee3').value.trim() : '';
    
    // 空でない担当者のみをカンマで結合
    const assigneeArray = [assignee1, assignee2, assignee3].filter(a => a);
    const assigneeValue = assigneeArray.length > 0 ? assigneeArray.join(',') : null;
    
    // カテゴリーと拠点の情報を取得
    const categorySelect = document.getElementById('category');
    const officeSelect = document.getElementById('office');
    
    const now = new Date().toISOString();
    const task = {
      id: generateUUID(),
      title: taskForm.title.value,
      description: taskForm.description.value,
      category: categorySelect ? categorySelect.value : null,
      office: officeSelect ? officeSelect.value : null,
      status: taskForm.status.value,
      priority: taskForm.priority.value,
      startDate: taskForm.startDate.value || null,
      dueDate: taskForm.dueDate.value || null,
      assignee: assigneeValue,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('新しいタスクを追加:', task);
    addTask(task);
    taskForm.reset();
    
    // フォームリセット後にプルダウンも初期化
    if (document.getElementById('assignee1')) {
      document.getElementById('assignee1').disabled = true;
      document.getElementById('assignee1').innerHTML = '<option value="">拠点を先に選択</option>';
    }
  });
  
  // 担当者入力欄を変更
  const assigneeInput = taskForm.querySelector('#assignee');
  if (assigneeInput) {
    const assigneeContainer = assigneeInput.closest('.mb-3');
    if (assigneeContainer) {
      // 元の入力欄の値を保持
      const currentValue = assigneeInput.value;
      
      // 元の入力欄を削除
      assigneeContainer.innerHTML = '';
      
      // 新しいラベルと入力欄を作成
      const newAssigneeFields = document.createElement('div');
      newAssigneeFields.innerHTML = `
        <label class="block text-sm font-medium text-gray-700 mb-1">担当者</label>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <input type="text" id="assignee1" name="assignee1" class="form-input w-full border border-gray-300 rounded p-2" placeholder="担当者1">
          </div>
          <div>
            <input type="text" id="assignee2" name="assignee2" class="form-input w-full border border-gray-300 rounded p-2" placeholder="担当者2">
          </div>
          <div>
            <input type="text" id="assignee3" name="assignee3" class="form-input w-full border border-gray-300 rounded p-2" placeholder="担当者3">
          </div>
        </div>
      `;
      
      assigneeContainer.appendChild(newAssigneeFields);
      
      // 既存の値があれば、最初の担当者欄に設定
      if (currentValue) {
        const assignees = currentValue.split(',').map(a => a.trim()).filter(a => a);
        if (assignees.length > 0) {
          const assignee1Input = taskForm.querySelector('#assignee1');
          if (assignee1Input) assignee1Input.value = assignees[0] || '';
          
          const assignee2Input = taskForm.querySelector('#assignee2');
          if (assignee2Input) assignee2Input.value = assignees[1] || '';
          
          const assignee3Input = taskForm.querySelector('#assignee3');
          if (assignee3Input) assignee3Input.value = assignees[2] || '';
        }
      }
    }
  }
  }

  // フィルターボタンのイベント
  filterButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      // 現在のフィルターを更新
      switch (index) {
        case 0: currentFilter = 'all'; break;
        case 1: currentFilter = STATUS.TODO; break;
        case 2: currentFilter = STATUS.IN_PROGRESS; break;
        case 3: currentFilter = STATUS.COMPLETED; break;
      }
      
      // ボタンのスタイルを更新
      filterButtons.forEach((btn, i) => {
        if (i === index) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // タスクリストを更新
      updateTaskList();
    });
  });

  // 検索入力のイベント
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      updateTaskList();
    });
  }

  // タスクフォームの折りたたみ機能
  if (taskFormToggle && taskFormContent) {
    taskFormToggle.addEventListener('click', () => {
      taskFormContent.classList.toggle('collapsed');
      taskFormContent.classList.toggle('expanded');
    });
  }

  // カレンダーナビゲーション
  if (prevMonthButton) {
  prevMonthButton.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    updateCalendar();
  });
  }
  
  if (nextMonthButton) {
  nextMonthButton.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    updateCalendar();
  });
  }
  
  if (todayButton) {
  todayButton.addEventListener('click', () => {
    currentCalendarDate = new Date();
    updateCalendar();
  });
  }

  // 期限日タイムラインを更新
  const updateDueDateTimeline = () => {
    if (!dueDateTimelineElement || !timelineLabelsElement) return;
    
    // タイムライン要素をクリア
    dueDateTimelineElement.innerHTML = '';
    timelineLabelsElement.innerHTML = '';

    // タイムライン全体にグリッド線のスタイルを適用
    dueDateTimelineElement.style.backgroundImage = 'linear-gradient(to right, rgba(229, 231, 235, 0.3) 1px, transparent 1px)';
    dueDateTimelineElement.style.backgroundSize = `${100/7}% 100%`;
    dueDateTimelineElement.style.backgroundPosition = 'right';
    dueDateTimelineElement.style.borderBottom = '1px solid rgba(229, 231, 235, 0.7)';
    
    // 今日の日付を取得
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 今後7日間のタイムラインを表示
    const days = 7;
    const dayWidth = 100 / days; // パーセンテージで幅を計算
    
    // タイムラインのラベルを生成
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // 日付ラベルを作成
      const dayLabel = document.createElement('div');
      dayLabel.style.width = `${dayWidth}%`;
      dayLabel.className = 'text-center';
      
      // 日付フォーマット
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      
      // 週末や特別な日に色を付ける
      let dayClass = '';
      if (date.getDay() === 0) { // 日曜日
        dayClass = 'text-red-500';
      } else if (date.getDay() === 6) { // 土曜日
        dayClass = 'text-blue-500';
      } else if (i === 0) { // 今日
        dayClass = 'font-bold text-green-600';
      }
      
      dayLabel.innerHTML = `<span class="${dayClass} text-sm">${month}/${day}(${weekday})</span>`;
      timelineLabelsElement.appendChild(dayLabel);
      
      // その日の期限タスクを取得
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate || task.status === STATUS.COMPLETED) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === date.getTime();
      });
      
      // タイムライン棒グラフを作成
      const barElement = document.createElement('div');
      barElement.style.width = `${dayWidth}%`;
      barElement.className = 'px-2 flex items-end h-full';
      
      if (dayTasks.length > 0) {
        // タスク数に応じて高さを設定（最大100%）
        const height = Math.min(dayTasks.length * 25, 100);
        
        // 優先度の高いタスクがあるかどうかを確認
        const hasHighPriority = dayTasks.some(task => task.priority === PRIORITY.HIGH);
        const hasMediumPriority = dayTasks.some(task => task.priority === PRIORITY.MEDIUM);
        
        // 優先度に基づいて色を設定
        let barColor = 'bg-green-500'; // デフォルト（低優先度）
        let shadowColor = 'rgba(16, 185, 129, 0.4)'; // 低優先度の影の色
        let priorityText = '低優先度';
        
        if (hasHighPriority) {
          barColor = 'bg-red-500'; // 高優先度
          shadowColor = 'rgba(239, 68, 68, 0.4)'; // 高優先度の影の色
          priorityText = '高優先度';
        } else if (hasMediumPriority) {
          barColor = 'bg-yellow-500'; // 中優先度
          shadowColor = 'rgba(245, 158, 11, 0.4)'; // 中優先度の影の色
          priorityText = '中優先度';
        }
        
        // ホバー時に表示するタスク詳細情報を準備
        const taskDetails = dayTasks.map(task => {
          let priorityClass = 'text-green-600';
          if (task.priority === PRIORITY.HIGH) {
            priorityClass = 'text-red-600';
          } else if (task.priority === PRIORITY.MEDIUM) {
            priorityClass = 'text-yellow-600';
          }
          
          // 担当者情報を取得
          const assignees = task.assignee ? task.assignee.split(',').map(a => a.trim()).filter(a => a) : [];
          let assigneeText = assignees.length > 0 ? assignees.join(', ') : '担当者なし';
          
          return `
            <div class="mb-2 pb-2 border-b border-gray-200 last:border-0">
              <div class="font-semibold">${task.title}</div>
              <div class="text-xs ${priorityClass}">優先度: ${getPriorityText(task.priority)}</div>
              <div class="text-xs">ステータス: ${getStatusText(task.status)}</div>
              <div class="text-xs">担当: ${assigneeText}</div>
            </div>
          `;
        }).join('');
        
        barElement.innerHTML = `
          <div class="relative timeline-bar ${barColor} rounded-t-md w-full cursor-pointer" 
               style="height: ${height}%; 
                      transition: height 0.3s ease-in-out;
                      box-shadow: 0 0 10px ${shadowColor};">
            <div class="text-white text-sm text-center font-bold pt-1">${dayTasks.length}</div>
          </div>
        `;

        // 今日のバーには特別なスタイルを適用
        if (i === 0) {
          const bar = barElement.querySelector('.timeline-bar');
          bar.style.animation = 'pulse 2s infinite';
          bar.style.border = '1px solid rgba(255,255,255,0.5)';
        }

        // ホバーイベントのリスナーを設定
        const bar = barElement.querySelector('.timeline-bar');
        
        bar.addEventListener('mouseenter', () => {
          const tooltip = document.createElement('div');
          tooltip.className = 'absolute z-50 bg-white rounded-md shadow-lg p-3 text-left text-sm';
          tooltip.style.position = 'fixed'; // 位置を固定
          tooltip.style.bottom = 'auto'; // 自動調整
          tooltip.style.top = (window.event.clientY - 10) + 'px'; // マウス位置の少し上
          tooltip.style.left = (window.event.clientX + 10) + 'px'; // マウス位置の右
          tooltip.style.minWidth = '250px';
          tooltip.style.maxWidth = '300px';
          tooltip.style.zIndex = '9999'; // 最前面に表示
          tooltip.style.borderTop = `3px solid ${hasHighPriority ? '#EF4444' : hasMediumPriority ? '#F59E0B' : '#10B981'}`;
          tooltip.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)';
          
          tooltip.innerHTML = `
            <div class="tooltip-content">
              <div class="font-bold mb-2 border-b border-gray-200 pb-1">
                ${month}/${day}(${weekday})の期限タスク: ${dayTasks.length}件
                <div class="text-xs font-normal mt-0.5 ${hasHighPriority ? 'text-red-600' : hasMediumPriority ? 'text-yellow-600' : 'text-green-600'}">
                  ${priorityText}のタスクを含みます
                </div>
              </div>
              <div class="max-h-48 overflow-y-auto">
                ${taskDetails}
              </div>
            </div>
          `;
          
          // ツールチップをボディに追加
          document.body.appendChild(tooltip);
          
          // 参照を保存
          bar._tooltip = tooltip;
        });
        
        bar.addEventListener('mouseleave', () => {
          if (bar._tooltip) {
            bar._tooltip.remove();
            bar._tooltip = null;
          }
        });
        
        // クリックイベントも追加（ホバーだけでは不十分な場合のため）
        bar.addEventListener('click', (e) => {
          // 既にツールチップが表示されている場合は削除
          if (bar._tooltip) {
            bar._tooltip.remove();
            bar._tooltip = null;
            return;
          }
          
          // 新しいツールチップを作成
          const tooltip = document.createElement('div');
          tooltip.className = 'absolute z-50 bg-white rounded-md shadow-lg p-3 text-left text-sm';
          tooltip.style.position = 'fixed';
          tooltip.style.top = (e.clientY - 10) + 'px';
          tooltip.style.left = (e.clientX + 10) + 'px';
          tooltip.style.minWidth = '250px';
          tooltip.style.maxWidth = '300px';
          tooltip.style.zIndex = '9999';
          tooltip.style.borderTop = `3px solid ${hasHighPriority ? '#EF4444' : hasMediumPriority ? '#F59E0B' : '#10B981'}`;
          tooltip.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)';
          
          tooltip.innerHTML = `
            <div class="tooltip-content">
              <div class="font-bold mb-2 border-b border-gray-200 pb-1">
                ${month}/${day}(${weekday})の期限タスク: ${dayTasks.length}件
                <div class="text-xs font-normal mt-0.5 ${hasHighPriority ? 'text-red-600' : hasMediumPriority ? 'text-yellow-600' : 'text-green-600'}">
                  ${priorityText}のタスクを含みます
                </div>
              </div>
              <div class="max-h-48 overflow-y-auto">
                ${taskDetails}
              </div>
            </div>
          `;
          
          // 閉じるボタンを追加
          const closeButton = document.createElement('button');
          closeButton.className = 'absolute top-1 right-1 text-gray-500 hover:text-gray-700';
          closeButton.innerHTML = '×';
          closeButton.style.fontSize = '16px';
          closeButton.style.fontWeight = 'bold';
          closeButton.style.border = 'none';
          closeButton.style.background = 'transparent';
          closeButton.style.cursor = 'pointer';
          closeButton.onclick = () => {
            tooltip.remove();
            bar._tooltip = null;
          };
          
          tooltip.appendChild(closeButton);
          document.body.appendChild(tooltip);
          
          // 参照を保存
          bar._tooltip = tooltip;
          
          // イベントの伝播を停止
          e.stopPropagation();
        });
      }
      
      dueDateTimelineElement.appendChild(barElement);
    }
    
    // タイムラインの範囲を表示
    if (timelineRangeElement) {
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + days - 1);
      
      const startMonth = today.getMonth() + 1;
      const startDay = today.getDate();
      const endMonth = endDate.getMonth() + 1;
      const endDay = endDate.getDate();
      
      timelineRangeElement.textContent = `${startMonth}/${startDay} ～ ${endMonth}/${endDay}の期限`;
      
      // パルスアニメーションのスタイルを追加
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        
        .tooltip-content {
          max-width: 250px;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // 初期化
    updateCurrentDate();
  loadTasks();
  initProgressChart();
  initMasterManagement();
  initDefaultMasterData();
  initTaskFormMasterData();
  initTabs();
  
  // 時間を1秒ごとに更新
  setInterval(updateCurrentDate, 1000);

  // デバッグ用のグローバル関数を追加
  window.debugCalendar = function() {
    console.log('=== カレンダーデバッグ情報 ===');
    console.log('現在のタスク数:', tasks.length);
    console.log('タスクデータ:', tasks);
    
    const calendarCells = document.querySelectorAll('.calendar-day[data-date]');
    console.log('カレンダーセル数:', calendarCells.length);
    
    let totalEvents = 0;
    calendarCells.forEach(cell => {
      const events = cell.querySelectorAll('.calendar-event');
      if (events.length > 0) {
        console.log(`日付 ${cell.getAttribute('data-date')}: ${events.length}個のイベント`);
        totalEvents += events.length;
      }
    });
    console.log('表示中の総イベント数:', totalEvents);
    
    if (typeof updateCalendar === 'function') {
      console.log('カレンダーを強制更新します...');
      updateCalendar();
    }
  };
  
  window.forceReloadMasterData = function() {
    console.log('マスタデータを強制再読み込みします');
    initTaskFormMasterData();
    updateCategoryList();
    updateOfficeAssigneeList();
  };
  
  // カレンダーモーダルから使用する更新関数をグローバルに公開
  window.updateTaskList = updateTaskList;
  window.updateFilterCounts = updateFilterCounts;
  window.updateAssigneeTasks = updateAssigneeTasks;
  window.updateWeeklyTasks = updateWeeklyTasks;
  window.updateStatistics = updateStatistics;
  window.updateProgressChart = updateProgressChart;
  window.updateDueDateTimeline = updateDueDateTimeline;
  window.updateCalendar = updateCalendar;
  window.loadTasks = loadTasks;
  
  // タスクデータを外部から更新するためのグローバル関数
  window.refreshAllTasks = function() {
    console.log('全タスクデータを再読み込みして画面を更新します');
    
    // ローカルストレージから最新のタスクデータを読み込み
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      try {
        tasks = JSON.parse(storedTasks);
        console.log('タスクデータを更新しました:', tasks.length + '件');
      } catch (error) {
        console.error('タスクの解析に失敗しました:', error);
        tasks = [];
      }
    } else {
      tasks = [];
    }
    
    // 全ての画面要素を更新
    updateTaskList();
    updateFilterCounts();
    updateAssigneeTasks();
    updateWeeklyTasks();
    updateStatistics();
    updateProgressChart();
    updateDueDateTimeline();
    
    // カレンダーも更新
    if (calendarDays) {
      updateCalendar();
    }
    
    console.log('全ての画面要素を更新しました');
  };
}); 

// タスク作成モーダルを表示する関数
const createTaskModal = (selectedDate) => {
  console.log('タスク作成モーダルを表示します。選択日:', selectedDate);
  
  // 日付をフォーマットする関数
  const formatFullDate = (dateString) => {
    if (!dateString) return '未設定';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}年${month}月${day}日(${weekday})`;
  };
  
  // UUIDを生成する関数
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  // モーダル要素を作成
  const modalElement = document.createElement('div');
  modalElement.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
  // モーダル内のフォーム
  modalElement.innerHTML = `
    <div class="modal-content bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
      <div class="p-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新しいタスクを登録
          </h3>
          <button type="button" class="modal-close text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <form id="create-task-form" class="p-4">
        <div class="grid grid-cols-3 gap-3 mb-3">
          <div class="col-span-2">
            <label for="create-title" class="block text-sm font-medium text-gray-700 mb-1">タイトル <span class="text-red-500">*</span></label>
            <input type="text" id="create-title" class="form-input w-full border border-gray-300 rounded p-2" placeholder="タスクのタイトルを入力" required>
          </div>
          <div>
            <label for="create-priority" class="block text-sm font-medium text-gray-700 mb-1">優先度 <span class="text-red-500">*</span></label>
            <select id="create-priority" class="form-select w-full border border-gray-300 rounded p-2">
              <option value="low">低</option>
              <option value="medium" selected>中</option>
              <option value="high">高</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label for="create-category" class="block text-sm font-medium text-gray-700 mb-1">業務カテゴリー</label>
            <select id="create-category" class="form-select w-full border border-gray-300 rounded p-2">
              <option value="">カテゴリーを選択</option>
              <!-- カテゴリーはJavaScriptで動的に追加 -->
            </select>
          </div>
          <div>
            <label for="create-office" class="block text-sm font-medium text-gray-700 mb-1">拠点</label>
            <select id="create-office" class="form-select w-full border border-gray-300 rounded p-2">
              <option value="">拠点を選択</option>
              <!-- 拠点はJavaScriptで動的に追加 -->
            </select>
          </div>
        </div>
        
        <div class="mb-3">
          <label for="create-description" class="block text-sm font-medium text-gray-700 mb-1">詳細</label>
          <textarea id="create-description" class="form-input w-full border border-gray-300 rounded p-2" rows="2" placeholder="タスクの詳細を入力（任意）"></textarea>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label for="create-status" class="block text-sm font-medium text-gray-700 mb-1">ステータス <span class="text-red-500">*</span></label>
            <select id="create-status" class="form-select w-full border border-gray-300 rounded p-2">
              <option value="todo" selected>未着手</option>
              <option value="in-progress">進行中</option>
              <option value="completed">完了</option>
            </select>
          </div>
          
          <div>
            <label for="create-start-date" class="block text-sm font-medium text-gray-700 mb-1">開始日</label>
            <input type="date" id="create-start-date" class="form-input w-full border border-gray-300 rounded p-2" value="${selectedDate}">
            <div class="text-xs text-gray-600 mt-1" id="create-start-date-display">${formatFullDate(selectedDate)}</div>
          </div>
        </div>
        
        <div class="mb-3">
          <label for="create-due-date" class="block text-sm font-medium text-gray-700 mb-1">終了日</label>
          <input type="date" id="create-due-date" class="form-input w-full border border-gray-300 rounded p-2" value="${selectedDate}">
          <div class="text-xs text-gray-600 mt-1" id="create-due-date-display">${formatFullDate(selectedDate)}</div>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">担当者</label>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-gray-500 mb-1">主担当者</label>
              <select id="create-assignee1" class="form-select w-full border border-gray-300 rounded p-2" disabled>
                <option value="">拠点を先に選択</option>
                <!-- 担当者1はJavaScriptで動的に追加 -->
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">副担当者1</label>
              <select id="create-assignee2" class="form-select w-full border border-gray-300 rounded p-2">
                <option value="">担当者を選択</option>
                <!-- 担当者2はJavaScriptで動的に追加 -->
              </select>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">副担当者2</label>
              <select id="create-assignee3" class="form-select w-full border border-gray-300 rounded p-2">
                <option value="">担当者を選択</option>
                <!-- 担当者3はJavaScriptで動的に追加 -->
              </select>
            </div>
          </div>
        </div>
        
        <div class="flex flex-wrap justify-end space-x-2">
          <button type="button" id="create-complete-btn" class="btn-success py-2 px-4 mr-auto bg-green-600 hover:bg-green-700 text-white font-medium rounded">
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              完了にする
            </span>
          </button>
          <button type="button" class="btn-secondary py-2 px-4 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-700 font-medium modal-cancel">キャンセル</button>
          <button type="submit" class="btn-primary py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded">
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              登録
            </span>
          </button>
        </div>
      </form>
    </div>
  `;
  
  // モーダルを本文に追加
  document.body.appendChild(modalElement);
  
  // カレンダー新規作成フォームのマスタデータ連携機能を初期化
  initCalendarCreateFormMasterData();
  
  // モーダルを閉じる処理
  const closeModal = () => {
    modalElement.remove();
  };
  
  // 閉じるボタンイベント
  modalElement.querySelector('.modal-close').addEventListener('click', closeModal);
  modalElement.querySelector('.modal-cancel').addEventListener('click', closeModal);
  
  // 背景クリックでも閉じる
  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) {
      closeModal();
    }
  });
  
  // 日付入力の変更イベントリスナー
  const startDateInput = modalElement.querySelector('#create-start-date');
  const dueDateInput = modalElement.querySelector('#create-due-date');
  const startDateDisplay = modalElement.querySelector('#create-start-date-display');
  const dueDateDisplay = modalElement.querySelector('#create-due-date-display');
  
  startDateInput.addEventListener('change', () => {
    startDateDisplay.textContent = startDateInput.value ? formatFullDate(startDateInput.value) : '';
  });
  
  dueDateInput.addEventListener('change', () => {
    dueDateDisplay.textContent = dueDateInput.value ? formatFullDate(dueDateInput.value) : '';
  });
  
  // 完了にするボタンのイベント
  const completeButton = modalElement.querySelector('#create-complete-btn');
  completeButton.addEventListener('click', () => {
    // 担当者の情報を収集（プルダウンから選択された値を取得）
    const assignee1 = modalElement.querySelector('#create-assignee1').value.trim();
    const assignee2 = modalElement.querySelector('#create-assignee2').value.trim();
    const assignee3 = modalElement.querySelector('#create-assignee3').value.trim();
    
    // 空でない担当者のみをカンマで結合
    const assigneeArray = [assignee1, assignee2, assignee3].filter(a => a);
    const assigneeValue = assigneeArray.length > 0 ? assigneeArray.join(',') : null;
    
    // カテゴリーと拠点の情報を取得
    const categorySelect = modalElement.querySelector('#create-category');
    const officeSelect = modalElement.querySelector('#create-office');
    
    const now = new Date().toISOString();
    const newTask = {
      id: generateUUID(),
      title: modalElement.querySelector('#create-title').value,
      description: modalElement.querySelector('#create-description').value,
      category: categorySelect ? categorySelect.value : '',
      office: officeSelect ? officeSelect.value : '',
      status: 'completed', // ステータスを完了に設定
      priority: modalElement.querySelector('#create-priority').value,
      startDate: modalElement.querySelector('#create-start-date').value || null,
      dueDate: modalElement.querySelector('#create-due-date').value || null,
      assignee: assigneeValue,
      createdAt: now,
      updatedAt: now
    };
    
    // ローカルストレージからタスクを取得
    const storedTasks = localStorage.getItem('tasks');
    let tasks = [];
    if (storedTasks) {
      try {
        tasks = JSON.parse(storedTasks);
      } catch (error) {
        console.error('タスクの解析に失敗しました:', error);
        tasks = [];
      }
    }
    
    // 新しいタスクを追加
    tasks.push(newTask);
    
    // ローカルストレージに保存
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // モーダルを閉じる
    closeModal();
    
    // 通知を表示
    showNotification('タスクを完了として登録しました', 'success');
    
    // 全タスクデータを再読み込みして画面を更新
    if (typeof window.refreshAllTasks === 'function') {
      window.refreshAllTasks();
    }
    
    // ダッシュボードタブに切り替え
    setTimeout(() => {
      const dashboardTab = document.querySelector('[data-tab="dashboard"]');
      if (dashboardTab) {
        dashboardTab.click();
      }
    }, 300);
  });
  
  // フォーム送信処理
  const createForm = modalElement.querySelector('#create-task-form');
  createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 担当者の情報を収集して結合
    const assignee1 = createForm.querySelector('#create-assignee1').value.trim();
    const assignee2 = createForm.querySelector('#create-assignee2').value.trim();
    const assignee3 = createForm.querySelector('#create-assignee3').value.trim();
    
    // 空でない担当者のみをカンマで結合
    const assigneeArray = [assignee1, assignee2, assignee3].filter(a => a);
    const assigneeValue = assigneeArray.length > 0 ? assigneeArray.join(',') : null;
    
    // カテゴリーと拠点の情報を取得
    const categorySelect = createForm.querySelector('#create-category');
    const officeSelect = createForm.querySelector('#create-office');
    
    const now = new Date().toISOString();
    const newTask = {
      id: generateUUID(),
      title: createForm.querySelector('#create-title').value,
      description: createForm.querySelector('#create-description').value,
      category: categorySelect ? categorySelect.value : '',
      office: officeSelect ? officeSelect.value : '',
      status: createForm.querySelector('#create-status').value,
      priority: createForm.querySelector('#create-priority').value,
      startDate: createForm.querySelector('#create-start-date').value || null,
      dueDate: createForm.querySelector('#create-due-date').value || null,
      assignee: assigneeValue,
      createdAt: now,
      updatedAt: now
    };
    
    // ローカルストレージからタスクを取得
    const storedTasks = localStorage.getItem('tasks');
    let tasks = [];
    if (storedTasks) {
      try {
        tasks = JSON.parse(storedTasks);
      } catch (error) {
        console.error('タスクの解析に失敗しました:', error);
        tasks = [];
      }
    }
    
    // 新しいタスクを追加
    tasks.push(newTask);
    
    // ローカルストレージに保存
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // モーダルを閉じる
    closeModal();
    
    // 通知を表示
    showNotification('タスクを登録しました', 'success');
    
    // 全タスクデータを再読み込みして画面を更新
    if (typeof window.refreshAllTasks === 'function') {
      window.refreshAllTasks();
    }
    
    // ダッシュボードタブに切り替え
    setTimeout(() => {
      const dashboardTab = document.querySelector('[data-tab="dashboard"]');
      if (dashboardTab) {
        dashboardTab.click();
      }
    }, 300);
  });
} 

// マスタ管理機能
const initMasterManagement = () => {
  console.log('マスタ管理初期化開始');
  
  // デフォルトデータを初期化
  initDefaultMasterData();
  
  // カテゴリー追加ボタン
  const addCategoryBtn = document.getElementById('add-category-btn');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', addCategory);
  }
  
  // 拠点追加ボタン
  const addOfficeBtn = document.getElementById('add-office-btn');
  if (addOfficeBtn) {
    addOfficeBtn.addEventListener('click', addOffice);
  }
  
  // 担当者追加ボタン
  const addAssigneeBtn = document.getElementById('add-assignee-btn');
  if (addAssigneeBtn) {
    addAssigneeBtn.addEventListener('click', addAssignee);
  }
  
  // Enterキーでの追加機能
  const newCategoryInput = document.getElementById('new-category');
  if (newCategoryInput) {
    newCategoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCategory();
      }
    });
  }
  
  const newOfficeInput = document.getElementById('new-office');
  if (newOfficeInput) {
    newOfficeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addOffice();
      }
    });
  }
  
  const newAssigneeInput = document.getElementById('new-assignee');
  if (newAssigneeInput) {
    newAssigneeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addAssignee();
      }
    });
  }
  
  // リストを初期表示
  updateCategoryList();
  updateOfficeSelect();
  updateOfficeAssigneeList();
  
  console.log('マスタ管理初期化完了');
};

// 初期マスタデータの設定
const initDefaultMasterData = () => {
  console.log('デフォルトマスタデータを初期化します');
  
  const categories = localStorage.getItem('businessCategories');
  if (!categories) {
    const defaultCategories = [
      '会議・打ち合わせ',
      '資料作成',
      'システム開発',
      '営業活動',
      '研修・教育',
      '事務処理'
    ];
    localStorage.setItem('businessCategories', JSON.stringify(defaultCategories));
    console.log('デフォルトカテゴリーを設定しました:', defaultCategories);
  } else {
    console.log('既存カテゴリーを保持します:', JSON.parse(categories));
  }
  
  const offices = localStorage.getItem('offices');
  console.log('既存のofficesデータ:', offices);
  
  // 拠点データが存在しない場合のみデフォルトデータを設定
  if (!offices) {
    const defaultOffices = {
      '札幌CO': ['山田太郎', '佐藤花子', '鈴木一郎', '田中次郎', '高橋三郎', '松本四郎', '渡辺五郎', '中村六郎', '小林七子', '加藤八子', '吉田九郎', '村田十子', '斉藤十一', '井上十二', '木村十三'],
      '仙台CO': ['後藤太郎', '藤田花子', '武田一郎', '上田次郎', '森田三郎', '前田四郎', '岡田五郎', '長田六郎', '石田七子', '原田八子', '竹田九郎', '池田十子', '山口十一', '橋本十二', '清水十三'],
      '愛知CO': ['和田太郎', '今井花子', '福田一郎', '西田次郎', '山本三郎', '井田四郎', '大田五郎', '金田六郎', '松田七子', '増田八子', '杉田九郎', '栗田十子', '織田十一', '神田十二', '沢田十三']
    };
    localStorage.setItem('offices', JSON.stringify(defaultOffices));
    console.log('デフォルト拠点データを設定しました:', defaultOffices);
  } else {
    console.log('既存拠点データを保持します:', JSON.parse(offices));
  }
  
  // ローカルストレージの内容を確認
  const storedOffices = JSON.parse(localStorage.getItem('offices') || '{}');
  console.log('最終的なローカルストレージ確認:', storedOffices);
};

// 業務カテゴリー追加
const addCategory = () => {
  const input = document.getElementById('new-category');
  const categoryName = input.value.trim();
  
  if (!categoryName) {
    showNotification('カテゴリー名を入力してください', 'warning');
    input.focus();
    return;
  }
  
  if (categoryName.length < 2 || categoryName.length > 20) {
    showNotification('カテゴリー名は2文字以上20文字以下で入力してください', 'warning');
    input.focus();
    return;
  }
  
  const categories = JSON.parse(localStorage.getItem('businessCategories') || '[]');
  
  if (categories.includes(categoryName)) {
    showNotification('このカテゴリーは既に存在します', 'warning');
    input.focus();
    return;
  }
  
  categories.push(categoryName);
  localStorage.setItem('businessCategories', JSON.stringify(categories));
  
  input.value = '';
  updateCategoryList();
  updateTaskFormCategories(); // タスクフォームのカテゴリーも更新
  showNotification(`カテゴリー「${categoryName}」を追加しました`, 'success');
};

// 拠点追加
const addOffice = () => {
  const input = document.getElementById('new-office');
  const officeName = input.value.trim();
  
  if (!officeName) {
    showNotification('拠点名を入力してください', 'warning');
    input.focus();
    return;
  }
  
  if (officeName.length < 2 || officeName.length > 15) {
    showNotification('拠点名は2文字以上15文字以下で入力してください', 'warning');
    input.focus();
    return;
  }
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  
  if (offices[officeName]) {
    showNotification('この拠点は既に存在します', 'warning');
    input.focus();
    return;
  }
  
  offices[officeName] = [];
  localStorage.setItem('offices', JSON.stringify(offices));
  
  input.value = '';
  updateOfficeSelect();
  updateOfficeAssigneeList();
  updateTaskFormOffices(); // タスクフォームの拠点プルダウンも更新
  updateTaskFormAllAssignees(); // 全担当者プルダウンも更新
  showNotification(`拠点「${officeName}」を追加しました`, 'success');
};

// 担当者追加
const addAssignee = () => {
  const officeSelect = document.getElementById('office-select');
  const input = document.getElementById('new-assignee');
  const selectedOffice = officeSelect.value;
  const assigneeName = input.value.trim();
  
  if (!selectedOffice) {
    showNotification('拠点を選択してください', 'warning');
    officeSelect.focus();
    return;
  }
  
  if (!assigneeName) {
    showNotification('担当者名を入力してください', 'warning');
    input.focus();
    return;
  }
  
  if (assigneeName.length < 2 || assigneeName.length > 10) {
    showNotification('担当者名は2文字以上10文字以下で入力してください', 'warning');
    input.focus();
    return;
  }
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  
  if (!offices[selectedOffice]) {
    showNotification('選択された拠点が存在しません', 'error');
    return;
  }
  
  if (offices[selectedOffice].includes(assigneeName)) {
    showNotification('この担当者は既に登録されています', 'warning');
    input.focus();
    return;
  }
  
  offices[selectedOffice].push(assigneeName);
  localStorage.setItem('offices', JSON.stringify(offices));
  
  input.value = '';
  updateOfficeAssigneeList();
  updateTaskFormAllAssignees(); // タスクフォームの担当者プルダウンも更新
  
  // 現在選択中の拠点の場合は、主担当者プルダウンも更新
  const currentOfficeSelect = document.getElementById('office');
  if (currentOfficeSelect && currentOfficeSelect.value === selectedOffice) {
    updateTaskFormMainAssignee(selectedOffice);
  }
  
  showNotification(`拠点「${selectedOffice}」に担当者「${assigneeName}」を追加しました`, 'success');
};

// 通知システム
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out translate-x-full`;
  
  const colors = {
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };
  
  notification.className += ` ${colors[type] || colors.info}`;
  
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
  };
  
  notification.innerHTML = `
    <div class="flex items-center">
      ${icons[type] || icons.info}
      <span class="ml-2 text-sm font-medium">${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // アニメーション表示
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // 自動削除
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
};

// カテゴリーリスト表示更新
const updateCategoryList = () => {
  const categoryList = document.getElementById('category-list');
  if (!categoryList) return;
  
  const categories = JSON.parse(localStorage.getItem('businessCategories') || '[]');
  
  // カウントを更新
  const categoryCountElement = document.getElementById('category-count');
  const totalCategoriesElement = document.getElementById('total-categories');
  if (categoryCountElement) categoryCountElement.textContent = `${categories.length}件`;
  if (totalCategoriesElement) totalCategoriesElement.textContent = categories.length;
  
  categoryList.innerHTML = '';
  
  if (categories.length === 0) {
    categoryList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p class="text-sm">カテゴリーが登録されていません</p>
        <p class="text-xs mt-1">新しいカテゴリーを追加してみましょう</p>
      </div>
    `;
    return;
  }
  
  categories.forEach((category, index) => {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'group flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 hover:shadow-md transition-all duration-200 hover:scale-105';
    
    categoryElement.innerHTML = `
      <div class="flex items-center">
        <div class="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3"></div>
        <span class="text-sm font-medium text-gray-800">${category}</span>
      </div>
      <button class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all duration-200" onclick="removeCategory(${index})" title="削除">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `;
    
    categoryList.appendChild(categoryElement);
  });
};

// 拠点選択肢更新
const updateOfficeSelect = () => {
  const officeSelect = document.getElementById('office-select');
  if (!officeSelect) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  
  // 最初のオプション以外を削除
  officeSelect.innerHTML = '<option value="">所属拠点を選択してください</option>';
  
  Object.keys(offices).forEach(office => {
    const option = document.createElement('option');
    option.value = office;
    option.textContent = office;
    officeSelect.appendChild(option);
  });
};

// 拠点・担当者一覧表示更新
const updateOfficeAssigneeList = () => {
  const officeAssigneeList = document.getElementById('office-assignee-list');
  if (!officeAssigneeList) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  console.log('updateOfficeAssigneeList - 現在のoffices:', offices);
  
  // 統計情報を更新
  const officeCount = Object.keys(offices).length;
  const totalAssignees = Object.values(offices).reduce((sum, assignees) => sum + assignees.length, 0);
  
  const officeCountElement = document.getElementById('office-count');
  const totalOfficesElement = document.getElementById('total-offices');
  const totalAssigneesElement = document.getElementById('total-assignees');
  
  if (officeCountElement) officeCountElement.textContent = `${officeCount}件`;
  if (totalOfficesElement) totalOfficesElement.textContent = officeCount;
  if (totalAssigneesElement) totalAssigneesElement.textContent = totalAssignees;
  
  officeAssigneeList.innerHTML = '';
  
  if (Object.keys(offices).length === 0) {
    officeAssigneeList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-sm">拠点が登録されていません</p>
        <p class="text-xs mt-1">新しい拠点を追加してみましょう</p>
      </div>
    `;
    return;
  }
  
  Object.entries(offices).forEach(([office, assignees]) => {
    console.log(`拠点: ${office}, 担当者数: ${assignees.length}`, assignees);
    
    const officeElement = document.createElement('div');
    officeElement.className = 'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200';
    
    // 担当者リストのHTML生成
    let assigneeListHTML = '';
    if (assignees.length > 0) {
      assignees.forEach((assignee, index) => {
        console.log(`担当者生成: ${assignee}, インデックス: ${index}, 拠点: ${office}`);
        assigneeListHTML += `
          <span class="assignee-badge inline-flex items-center px-2 py-1 rounded-full text-2xs bg-blue-100 text-blue-800 mr-1 mb-1 hover:bg-blue-200 transition-colors duration-200 max-w-[140px]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="assignee-name truncate flex-1 min-w-0" title="${assignee}">${assignee}</span>
            <button class="assignee-delete-btn ml-1 text-blue-600 hover:text-red-600 transition-colors duration-200 flex-shrink-0" data-office="${office}" data-index="${index}" data-name="${assignee}" title="削除">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        `;
      });
    } else {
      assigneeListHTML = '<span class="text-gray-500 text-xs italic">担当者が登録されていません</span>';
    }
    
    officeElement.innerHTML = `
      <div class="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-sm text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            ${office}
          </h4>
          <div class="flex items-center text-white text-xs">
            <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full mr-2">${assignees.length}名</span>
            <button class="office-delete-btn text-white hover:text-red-200 p-1 rounded-full hover:bg-red-500 hover:bg-opacity-50 transition-all duration-200" data-office="${office}" title="拠点削除">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="p-3 bg-gray-50 assignee-scroll-area" style="max-height: 400px; overflow-y: auto;">
        <div class="flex flex-wrap gap-1">
          ${assigneeListHTML}
        </div>
        ${assignees.length === 0 ? `
          <div class="text-center py-4 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <p class="text-xs">担当者を追加してください</p>
          </div>
        ` : ''}
      </div>
    `;
    
    officeAssigneeList.appendChild(officeElement);
  });
  
  // 既存のイベントリスナーを削除
  const existingListeners = officeAssigneeList.cloneNode(true);
  officeAssigneeList.parentNode.replaceChild(existingListeners, officeAssigneeList);
  const newOfficeAssigneeList = document.getElementById('office-assignee-list');
  
  // イベントデリゲーションを使用して担当者削除ボタンのイベントリスナーを設定
  newOfficeAssigneeList.addEventListener('click', function(e) {
    if (e.target.closest('.assignee-delete-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      const button = e.target.closest('.assignee-delete-btn');
      const office = button.getAttribute('data-office');
      const index = button.getAttribute('data-index');
      const name = button.getAttribute('data-name');
      
      console.log('担当者削除ボタンクリック:', { office, index, name });
      console.log('データ属性確認:', {
        'data-office': office,
        'data-index': index,
        'data-name': name
      });
      
      if (office && index !== null && name) {
        if (confirm(`担当者「${name}」を削除しますか？`)) {
          removeAssignee(office, parseInt(index));
        }
      } else {
        console.error('データ属性が正しく取得できません:', { office, index, name });
        showNotification('削除データの取得に失敗しました', 'error');
      }
    }
  });
  
  // イベントデリゲーションを使用して拠点削除ボタンのイベントリスナーを設定
  newOfficeAssigneeList.addEventListener('click', function(e) {
    if (e.target.closest('.office-delete-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      const button = e.target.closest('.office-delete-btn');
      const office = button.getAttribute('data-office');
      
      console.log('拠点削除ボタンがクリックされました:', office);
      if (office) {
        removeOffice(office);
      }
    }
  });
};

// カテゴリー削除
const removeCategory = (index) => {
  const categories = JSON.parse(localStorage.getItem('businessCategories') || '[]');
  const categoryName = categories[index];
  
  if (!confirm(`カテゴリー「${categoryName}」を削除してもよろしいですか？`)) {
    return;
  }
  
  categories.splice(index, 1);
  localStorage.setItem('businessCategories', JSON.stringify(categories));
  
  updateCategoryList();
  showNotification(`カテゴリー「${categoryName}」を削除しました。`, 'success');
  console.log('カテゴリーを削除しました');
};

// 拠点削除
const removeOffice = (officeName) => {
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  
  if (offices[officeName]) {
    const assigneeCount = offices[officeName].length;
    const message = assigneeCount > 0 
      ? `拠点「${officeName}」と所属する${assigneeCount}名の担当者を削除しますか？`
      : `拠点「${officeName}」を削除しますか？`;
    
    if (confirm(message)) {
      delete offices[officeName];
      localStorage.setItem('offices', JSON.stringify(offices));
      
      showNotification(`拠点「${officeName}」を削除しました`, 'success');
      updateOfficeAssigneeList();
      updateOfficeSelect();
      
      // 統計を更新
      updateCategoryList();
    }
  }
};

// 担当者削除
const removeAssignee = (officeName, assigneeIndex) => {
  console.log('=== removeAssignee 開始 ===');
  console.log('引数:', { officeName, assigneeIndex, indexType: typeof assigneeIndex });
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  console.log('ローカルストレージから取得したoffices:', offices);
  console.log('指定された拠点の存在確認:', officeName, '存在:', !!offices[officeName]);
  
  if (offices[officeName]) {
    console.log('拠点の担当者リスト:', offices[officeName]);
    console.log('インデックス位置の担当者:', offices[officeName][assigneeIndex]);
    console.log('リスト長:', offices[officeName].length);
  }
  
  if (offices[officeName] && assigneeIndex >= 0 && assigneeIndex < offices[officeName].length) {
    const assigneeName = offices[officeName][assigneeIndex];
    console.log('削除対象担当者:', assigneeName);
    
    // 削除実行
    offices[officeName].splice(assigneeIndex, 1);
    localStorage.setItem('offices', JSON.stringify(offices));
    
    console.log('削除後のoffices:', offices);
    
    showNotification(`担当者「${assigneeName}」を削除しました`, 'success');
    
    // リストを更新
    updateOfficeAssigneeList();
    updateOfficeSelect();
    
    // 統計を更新
    updateCategoryList();
    
    console.log('=== removeAssignee 成功終了 ===');
  } else {
    console.error('=== removeAssignee エラー ===');
    console.error('担当者が見つかりません:');
    console.error('  拠点名:', officeName);
    console.error('  インデックス:', assigneeIndex);
    console.error('  拠点存在:', !!offices[officeName]);
    console.error('  インデックス有効範囲:', assigneeIndex >= 0 && assigneeIndex < (offices[officeName] ? offices[officeName].length : 0));
    console.error('  全データ:', offices);
    showNotification('担当者の削除に失敗しました', 'error');
  }
};

// グローバルスコープでの削除関数の定義（HTMLのonclickから呼び出すため）
window.removeCategory = removeCategory;
window.removeOffice = removeOffice;
window.removeAssignee = removeAssignee;

// デバッグ用ヘルパー関数
window.debugMaster = function() {
  console.log('=== マスタデータ デバッグ情報 ===');
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const categories = JSON.parse(localStorage.getItem('businessCategories') || '[]');
  
  console.log('カテゴリー:', categories);
  console.log('拠点データ:', offices);
  
  Object.entries(offices).forEach(([office, assignees]) => {
    console.log(`拠点: ${office} (${assignees.length}名)`);
    assignees.forEach((assignee, index) => {
      console.log(`  ${index}: ${assignee}`);
    });
  });
  
  return { offices, categories };
};

window.resetMasterData = function() {
  const confirmMessage = 'マスタデータをリセットしますか？\n現在のカテゴリーと拠点・担当者データがすべて削除され、デフォルトデータに戻ります。';
  if (!confirm(confirmMessage)) {
    console.log('リセットがキャンセルされました');
    return;
  }
  
  console.log('マスタデータをリセットします');
  localStorage.removeItem('offices');
  localStorage.removeItem('businessCategories');
  initDefaultMasterData();
  updateCategoryList();
  updateOfficeSelect();
  updateOfficeAssigneeList();
  console.log('リセット完了');
};

window.resetAllData = function() {
  const confirmMessage = 'すべてのデータをリセットしますか？\nタスク、マスタデータがすべて削除され、初期状態に戻ります。';
  if (!confirm(confirmMessage)) {
    console.log('リセットがキャンセルされました');
    return;
  }
  
  console.log('すべてのデータをリセットします');
  localStorage.clear();
  
  // マスタデータのみ初期化（タスクは空の状態）
  initDefaultMasterData();
  updateCategoryList();
  updateOfficeSelect();
  updateOfficeAssigneeList();
  
  // ページをリロードして表示を更新
  location.reload();
};

// タスクフォームのマスタデータ連携初期化
const initTaskFormMasterData = () => {
  console.log('タスクフォームのマスタデータ連携を初期化します');
  
  // カテゴリープルダウンを更新
  updateTaskFormCategories();
  
  // 拠点プルダウンを更新
  updateTaskFormOffices();
  
  // 全担当者プルダウンを更新（担当者2,3用）
  updateTaskFormAllAssignees();
  
  // 拠点選択時のイベントリスナーを設定
  const officeSelect = document.getElementById('office');
  if (officeSelect) {
    officeSelect.addEventListener('change', function() {
      updateTaskFormMainAssignee(this.value);
    });
  }
};

// カテゴリープルダウンを更新
const updateTaskFormCategories = () => {
  const categorySelect = document.getElementById('category');
  if (!categorySelect) return;
  
  const categories = JSON.parse(localStorage.getItem('businessCategories') || '[]');
  console.log('タスクフォーム：カテゴリー数', categories.length);
  
  // 既存のオプションをクリア（最初のオプション以外）
  categorySelect.innerHTML = '<option value="">カテゴリーを選択</option>';
  
  // カテゴリーを追加
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
};

// 拠点プルダウンを更新
const updateTaskFormOffices = () => {
  const officeSelect = document.getElementById('office');
  if (!officeSelect) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const officeNames = Object.keys(offices);
  console.log('タスクフォーム：拠点数', officeNames.length);
  
  // 既存のオプションをクリア
  officeSelect.innerHTML = '<option value="">拠点を選択</option>';
  
  // 拠点を追加
  officeNames.forEach(officeName => {
    const option = document.createElement('option');
    option.value = officeName;
    option.textContent = officeName;
    officeSelect.appendChild(option);
  });
};

// 全担当者プルダウンを更新（担当者2,3用）
const updateTaskFormAllAssignees = () => {
  const assignee2Select = document.getElementById('assignee2');
  const assignee3Select = document.getElementById('assignee3');
  
  if (!assignee2Select || !assignee3Select) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const allAssignees = [];
  
  // 全拠点の担当者を収集
  Object.keys(offices).forEach(officeName => {
    const assignees = offices[officeName] || [];
    assignees.forEach(assignee => {
      if (!allAssignees.includes(assignee)) {
        allAssignees.push(assignee);
      }
    });
  });
  
  console.log('タスクフォーム：全担当者数', allAssignees.length);
  
  // 担当者2のプルダウンを更新
  assignee2Select.innerHTML = '<option value="">担当者を選択</option>';
  allAssignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    assignee2Select.appendChild(option);
  });
  
  // 担当者3のプルダウンを更新
  assignee3Select.innerHTML = '<option value="">担当者を選択</option>';
  allAssignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    assignee3Select.appendChild(option);
  });
};

// 選択拠点の担当者プルダウンを更新（担当者1用）
const updateTaskFormMainAssignee = (selectedOffice) => {
  const assignee1Select = document.getElementById('assignee1');
  if (!assignee1Select) return;
  
  if (!selectedOffice) {
    assignee1Select.innerHTML = '<option value="">拠点を先に選択</option>';
    assignee1Select.disabled = true;
    return;
  }
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const assignees = offices[selectedOffice] || [];
  
  console.log(`タスクフォーム：${selectedOffice}の担当者数`, assignees.length);
  
  // プルダウンを更新
  assignee1Select.innerHTML = '<option value="">主担当者を選択</option>';
  assignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    assignee1Select.appendChild(option);
  });
  
  assignee1Select.disabled = false;
}

// 編集フォームのマスタデータ連携初期化
const initEditFormMasterData = (task, assignees) => {
  console.log('編集フォームのマスタデータ連携を初期化します', task);
  
  // カテゴリープルダウンを更新
  updateEditFormCategories(task.category);
  
  // 拠点プルダウンを更新
  updateEditFormOffices(task.office);
  
  // 全担当者プルダウンを更新（担当者2,3用）
  updateEditFormAllAssignees(assignees);
  
  // 拠点に応じた主担当者を更新
  if (task.office) {
    updateEditFormMainAssignee(task.office, assignees[0] || '');
  }
  
  // 拠点選択時のイベントリスナーを設定
  const officeSelect = document.getElementById('edit-office');
  if (officeSelect) {
    officeSelect.addEventListener('change', function() {
      updateEditFormMainAssignee(this.value, '');
    });
  }
};

// 編集フォーム：カテゴリープルダウンを更新
const updateEditFormCategories = (selectedCategory = '') => {
  const categorySelect = document.getElementById('edit-category');
  if (!categorySelect) return;
  
  const categories = JSON.parse(localStorage.getItem('businessCategories') || '[]');
  console.log('編集フォーム：カテゴリー数', categories.length);
  
  // 既存のオプションをクリア
  categorySelect.innerHTML = '<option value="">カテゴリーを選択</option>';
  
  // カテゴリーを追加
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    if (category === selectedCategory) {
      option.selected = true;
    }
    categorySelect.appendChild(option);
  });
};

// 編集フォーム：拠点プルダウンを更新
const updateEditFormOffices = (selectedOffice = '') => {
  const officeSelect = document.getElementById('edit-office');
  if (!officeSelect) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const officeNames = Object.keys(offices);
  console.log('編集フォーム：拠点数', officeNames.length);
  
  // 既存のオプションをクリア
  officeSelect.innerHTML = '<option value="">拠点を選択</option>';
  
  // 拠点を追加
  officeNames.forEach(officeName => {
    const option = document.createElement('option');
    option.value = officeName;
    option.textContent = officeName;
    if (officeName === selectedOffice) {
      option.selected = true;
    }
    officeSelect.appendChild(option);
  });
};

// 編集フォーム：全担当者プルダウンを更新（担当者2,3用）
const updateEditFormAllAssignees = (currentAssignees = []) => {
  const assignee2Select = document.getElementById('edit-assignee2');
  const assignee3Select = document.getElementById('edit-assignee3');
  
  if (!assignee2Select || !assignee3Select) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const allAssignees = [];
  
  // 全拠点の担当者を収集
  Object.keys(offices).forEach(officeName => {
    const assignees = offices[officeName] || [];
    assignees.forEach(assignee => {
      if (!allAssignees.includes(assignee)) {
        allAssignees.push(assignee);
      }
    });
  });
  
  console.log('編集フォーム：全担当者数', allAssignees.length);
  
  // 担当者2のプルダウンを更新
  assignee2Select.innerHTML = '<option value="">担当者を選択</option>';
  allAssignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    if (assignee === (currentAssignees[1] || '')) {
      option.selected = true;
    }
    assignee2Select.appendChild(option);
  });
  
  // 担当者3のプルダウンを更新
  assignee3Select.innerHTML = '<option value="">担当者を選択</option>';
  allAssignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    if (assignee === (currentAssignees[2] || '')) {
      option.selected = true;
    }
    assignee3Select.appendChild(option);
  });
};

// 編集フォーム：選択拠点の担当者プルダウンを更新（担当者1用）
const updateEditFormMainAssignee = (selectedOffice, selectedAssignee = '') => {
  const assignee1Select = document.getElementById('edit-assignee1');
  if (!assignee1Select) return;
  
  if (!selectedOffice) {
    assignee1Select.innerHTML = '<option value="">拠点を先に選択</option>';
    assignee1Select.disabled = true;
    return;
  }
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const assignees = offices[selectedOffice] || [];
  
  console.log(`編集フォーム：${selectedOffice}の担当者数`, assignees.length);
  
  // プルダウンを更新
  assignee1Select.innerHTML = '<option value="">主担当者を選択</option>';
  assignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    if (assignee === selectedAssignee) {
      option.selected = true;
    }
    assignee1Select.appendChild(option);
  });
  
  assignee1Select.disabled = false;
}

// カレンダー新規作成フォームのマスタデータ連携初期化
const initCalendarCreateFormMasterData = () => {
  console.log('カレンダー新規作成フォームのマスタデータ連携を初期化します');
  
  // カテゴリープルダウンを更新
  updateCalendarCreateFormCategories();
  
  // 拠点プルダウンを更新
  updateCalendarCreateFormOffices();
  
  // 全担当者プルダウンを更新（担当者2,3用）
  updateCalendarCreateFormAllAssignees();
  
  // 拠点選択時のイベントリスナーを設定
  const officeSelect = document.getElementById('create-office');
  if (officeSelect) {
    officeSelect.addEventListener('change', function() {
      updateCalendarCreateFormMainAssignee(this.value);
    });
  }
};

// カレンダー新規作成フォーム：カテゴリープルダウンを更新
const updateCalendarCreateFormCategories = () => {
  const categorySelect = document.getElementById('create-category');
  if (!categorySelect) return;
  
  const categories = JSON.parse(localStorage.getItem('businessCategories') || '[]');
  console.log('カレンダー新規作成フォーム：カテゴリー数', categories.length);
  
  // 既存のオプションをクリア
  categorySelect.innerHTML = '<option value="">カテゴリーを選択</option>';
  
  // カテゴリーを追加
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
};

// カレンダー新規作成フォーム：拠点プルダウンを更新
const updateCalendarCreateFormOffices = () => {
  const officeSelect = document.getElementById('create-office');
  if (!officeSelect) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const officeNames = Object.keys(offices);
  console.log('カレンダー新規作成フォーム：拠点数', officeNames.length);
  
  // 既存のオプションをクリア
  officeSelect.innerHTML = '<option value="">拠点を選択</option>';
  
  // 拠点を追加
  officeNames.forEach(officeName => {
    const option = document.createElement('option');
    option.value = officeName;
    option.textContent = officeName;
    officeSelect.appendChild(option);
  });
};

// カレンダー新規作成フォーム：全担当者プルダウンを更新（担当者2,3用）
const updateCalendarCreateFormAllAssignees = () => {
  const assignee2Select = document.getElementById('create-assignee2');
  const assignee3Select = document.getElementById('create-assignee3');
  
  if (!assignee2Select || !assignee3Select) return;
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const allAssignees = [];
  
  // 全拠点の担当者を収集
  Object.keys(offices).forEach(officeName => {
    const assignees = offices[officeName] || [];
    assignees.forEach(assignee => {
      if (!allAssignees.includes(assignee)) {
        allAssignees.push(assignee);
      }
    });
  });
  
  console.log('カレンダー新規作成フォーム：全担当者数', allAssignees.length);
  
  // 担当者2のプルダウンを更新
  assignee2Select.innerHTML = '<option value="">担当者を選択</option>';
  allAssignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    assignee2Select.appendChild(option);
  });
  
  // 担当者3のプルダウンを更新
  assignee3Select.innerHTML = '<option value="">担当者を選択</option>';
  allAssignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    assignee3Select.appendChild(option);
  });
};

// カレンダー新規作成フォーム：選択拠点の担当者プルダウンを更新（担当者1用）
const updateCalendarCreateFormMainAssignee = (selectedOffice) => {
  const assignee1Select = document.getElementById('create-assignee1');
  if (!assignee1Select) return;
  
  if (!selectedOffice) {
    assignee1Select.innerHTML = '<option value="">拠点を先に選択</option>';
    assignee1Select.disabled = true;
    return;
  }
  
  const offices = JSON.parse(localStorage.getItem('offices') || '{}');
  const assignees = offices[selectedOffice] || [];
  
  console.log(`カレンダー新規作成フォーム：${selectedOffice}の担当者数`, assignees.length);
  
  // プルダウンを更新
  assignee1Select.innerHTML = '<option value="">主担当者を選択</option>';
  assignees.forEach(assignee => {
    const option = document.createElement('option');
    option.value = assignee;
    option.textContent = assignee;
    assignee1Select.appendChild(option);
  });
  
  assignee1Select.disabled = false;
}

// ページ読み込み完了時の初期化処理
document.addEventListener('DOMContentLoaded', async function() {
  console.log('app.js: DOMContentLoaded イベントが発生しました');
  
  // dataManagerが利用可能かチェック
  if (window.dataManager) {
    console.log('✅ Firebase DataManager が利用可能です');
    console.log('🔥 Firebase接続状況:', window.dataManager.isOnline() ? 'オンライン' : 'オフライン');
  } else {
    console.log('⚠️ Firebase DataManager が見つかりません。少し待ってから再試行します...');
    // 短時間待機してから再チェック
    setTimeout(async () => {
      if (window.dataManager) {
        console.log('✅ Firebase DataManager が利用可能になりました');
        await initializeApp();
      } else {
        console.error('❌ Firebase初期化に失敗しました');
      }
    }, 500);
    return;
  }
  
  // 初期化処理を実行
  await initializeApp();
});

// 初期化関数
async function initializeApp() {
  // 確実にダッシュボードタブを表示する
  const forceShowDashboard = () => {
    console.log('強制的にダッシュボードタブを表示します');
    
    // 全てのタブからアクティブクラスを削除
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // 全てのタブコンテンツからアクティブクラスを削除
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // ダッシュボードタブとコンテンツをアクティブにする
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    const dashboardContent = document.getElementById('dashboard-content');
    
    if (dashboardTab && dashboardContent) {
      dashboardTab.classList.add('active');
      dashboardContent.classList.add('active');
      console.log('✅ ダッシュボードタブがアクティブになりました');
    } else {
      console.error('❌ ダッシュボードタブまたはコンテンツが見つかりません');
    }
  };
  
  // 複数のタイミングで実行
  setTimeout(forceShowDashboard, 150);
  setTimeout(forceShowDashboard, 300);
  setTimeout(forceShowDashboard, 500);
  
  // データを読み込み
  try {
    await loadTasks();
    console.log('✅ タスクデータの読み込みが完了しました');
    
    // 更新完了の通知を表示
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = '✅ 更新しました';
    document.body.appendChild(notification);
    
    // 3秒後に通知を削除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ タスクデータの読み込み中にエラーが発生しました:', error);
  }
  
  console.log('🎉 アプリ初期化処理が完了しました');
}
