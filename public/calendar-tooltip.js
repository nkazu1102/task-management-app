// カレンダータスクにツールチップを追加する関数
function createCalendarTaskWithTooltip(task, dateStr, statusIcon, isPeriodTask) {
  // 表示タイトルを準備
  let taskTitle = '';
  if (isPeriodTask) {
    const startDateStr = task.startDate.split('T')[0];
    const dueDateStr = task.dueDate.split('T')[0];
    
    if (startDateStr === dueDateStr) {
      // 開始日と終了日が同じ
      taskTitle = statusIcon + `[${task.title}]`;
    } else if (dateStr === startDateStr) {
      // 開始日
      taskTitle = statusIcon + `${task.title} →`;
    } else if (dateStr === dueDateStr) {
      // 終了日
      taskTitle = statusIcon + `${task.title} ←`;
    } else {
      // 期間中
      taskTitle = statusIcon + `${task.title} ↔`;
    }
  } else {
    // 単日タスク
    taskTitle = statusIcon + task.title;
  }
  
  // タスクの内容を設定（タイトルとツールチップ）
  return `
    <span class="task-title">${taskTitle}</span>
    <div class="task-tooltip">
      <div class="font-semibold mb-1">${task.title}</div>
      ${task.description ? `<div class="text-xs text-gray-600 mb-1">${task.description}</div>` : ''}
      <div class="grid grid-cols-2 gap-1 mt-2">
        <div class="text-xs">
          <span class="font-medium">ステータス:</span> 
          <span class="${
            task.status === 'todo' ? 'text-yellow-600' : 
            task.status === 'in-progress' ? 'text-blue-600' : 'text-green-600'
          }">${
            task.status === 'todo' ? '未着手' : 
            task.status === 'in-progress' ? '進行中' : '完了'
          }</span>
        </div>
        <div class="text-xs">
          <span class="font-medium">優先度:</span> 
          <span class="${
            task.priority === 'high' ? 'text-red-600' : 
            task.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
          }">${
            task.priority === 'high' ? '高' : 
            task.priority === 'medium' ? '中' : '低'
          }</span>
        </div>
      </div>
      ${task.assignee ? `
        <div class="text-xs mt-1">
          <span class="font-medium">担当:</span> ${task.assignee}
        </div>
      ` : ''}
      <div class="text-xs mt-1">
        ${isPeriodTask ? 
          `<span class="font-medium">期間:</span> ${formatDate(task.startDate)} 〜 ${formatDate(task.dueDate)}` : 
          task.dueDate ? 
            `<span class="font-medium">期限:</span> ${formatDate(task.dueDate)}` : 
            task.startDate ? 
              `<span class="font-medium">開始日:</span> ${formatDate(task.startDate)}` : 
              ''
        }
      </div>
    </div>
  `;
  
  function formatDate(dateString) {
    if (!dateString) return '期限なし';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${month}月${day}日(${weekday})`;
  }
}

// カレンダーツールチップ機能を提供するスクリプト
document.addEventListener('DOMContentLoaded', function() {
  console.log('カレンダーツールチップスクリプトが読み込まれました');
  
  // グローバル関数として公開
  window.initializeCalendarTooltips = function() {
    console.log('カレンダーツールチップを初期化します');
    
    // すべてのカレンダーイベントを取得
    const calendarEvents = document.querySelectorAll('.calendar-event');
    console.log(`ツールチップを設定するカレンダーイベント数: ${calendarEvents.length}`);
    
    if (calendarEvents.length === 0) {
      console.log('カレンダーイベントが見つかりません。再試行します。');
      setTimeout(window.initializeCalendarTooltips, 500);
      return;
    }
    
    // 既存のツールチップリスナーを削除
    calendarEvents.forEach(event => {
      // 既存のイベントリスナーを削除するためにクローンを作成
      const clonedEvent = event.cloneNode(true);
      if (event.parentNode) {
        event.parentNode.replaceChild(clonedEvent, event);
      }
    });
    
    // 新しいツールチップリスナーを設定
    document.querySelectorAll('.calendar-event').forEach(event => {
      // taskIdを設定
      if (!event.getAttribute('data-task-id') && event.id) {
        event.setAttribute('data-task-id', event.id);
      }
      
      // mouseenterイベントでツールチップを表示
      event.addEventListener('mouseenter', function(e) {
        // 既存のツールチップがあれば削除
        if (this._tooltip && this._tooltip.parentNode) {
          this._tooltip.parentNode.removeChild(this._tooltip);
          this._tooltip = null;
        }
        
        // ツールチップのテキストを取得（data-title属性またはテキスト内容）
        const tooltipText = this.getAttribute('data-title') || this.textContent;
        if (!tooltipText) return;
        
        // データ属性から情報を取得
        const title = this.getAttribute('data-title') || tooltipText;
        const description = this.getAttribute('data-description') || '';
        const status = this.getAttribute('data-status') || '';
        const priority = this.getAttribute('data-priority') || '';
        const assignees = this.getAttribute('data-assignees') || '';
        const startDate = this.getAttribute('data-startdate') || '';
        const dueDate = this.getAttribute('data-duedate') || '';
        
        // ツールチップ要素を作成
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-50 bg-white rounded-md shadow-lg p-3 text-left text-xs border';
        
        // 優先度に応じたスタイル
        let borderTopColor = '#3B82F6'; // デフォルト青
        if (this.classList.contains('priority-high')) {
          borderTopColor = '#EF4444'; // 赤
        } else if (this.classList.contains('priority-medium')) {
          borderTopColor = '#F59E0B'; // 黄
        } else if (this.classList.contains('priority-low')) {
          borderTopColor = '#10B981'; // 緑
        }
        
        // 内容を簡潔にまとめる
        let tooltipContent = `
          <div class="tooltip-content">
            <div class="font-bold mb-2 border-b border-gray-200 pb-1">
              ${title}
            </div>
        `;
        
        if (description) {
          tooltipContent += `<div class="text-xs text-gray-600 mb-1">${description}</div>`;
        }
        
        if (status) {
          tooltipContent += `<div class="text-xs">ステータス: ${status}</div>`;
        }
        
        if (priority) {
          tooltipContent += `<div class="text-xs">優先度: ${priority}</div>`;
        }
        
        if (assignees) {
          tooltipContent += `<div class="text-xs">担当: ${assignees}</div>`;
        }
        
        if (startDate && dueDate) {
          tooltipContent += `<div class="text-xs">期間: ${startDate} 〜 ${dueDate}</div>`;
        } else if (startDate) {
          tooltipContent += `<div class="text-xs">開始日: ${startDate}</div>`;
        } else if (dueDate) {
          tooltipContent += `<div class="text-xs">期限: ${dueDate}</div>`;
        }
        
        tooltipContent += `</div>`;
        tooltip.innerHTML = tooltipContent;
        
        // スタイルを設定
        tooltip.style.position = 'fixed';
        tooltip.style.minWidth = '250px';
        tooltip.style.maxWidth = '300px';
        tooltip.style.zIndex = '9999';
        tooltip.style.borderTop = `3px solid ${borderTopColor}`;
        tooltip.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        tooltip.style.pointerEvents = 'none'; // ポインターイベントを無効化
        tooltip.style.backgroundColor = '#ffffff';
        
        // 完了タスクのスタイル
        if (this.classList.contains('completed')) {
          tooltip.style.opacity = '0.7';
        }
        
        // ツールチップの位置を調整
        const rect = this.getBoundingClientRect();
        tooltip.style.top = (e.clientY - 10) + 'px';
        tooltip.style.left = (e.clientX + 15) + 'px';
        
        // 画面右端で位置調整
        if (rect.left + 300 > window.innerWidth) {
          tooltip.style.left = (window.innerWidth - 310) + 'px';
        }
        
        // ツールチップを表示
        document.body.appendChild(tooltip);
        
        // 参照を保存
        this._tooltip = tooltip;
      });
      
      // mouseleaveイベントでツールチップを削除
      event.addEventListener('mouseleave', function() {
        if (this._tooltip && this._tooltip.parentNode) {
          this._tooltip.parentNode.removeChild(this._tooltip);
          this._tooltip = null;
        }
      });
      
      // クリックイベントでタスク編集
      event.addEventListener('click', function(e) {
        // タスク編集ダイアログを開く
        e.stopPropagation(); // イベント伝播を停止
        
        // タスクのIDを取得
        const taskId = this.getAttribute('data-task-id');
        if (taskId && window.editTask && window.tasks) {
          // 編集ダイアログを開く
          const taskData = window.tasks.find(t => t.id === taskId);
          if (taskData) {
            window.editTask(taskData);
          }
        }
      });
    });
    
    console.log('カレンダーツールチップの初期化が完了しました');
  };
  
  // スタイルを動的に追加
  function addTooltipStyles() {
    // 既存のスタイルを削除
    const existingStyle = document.getElementById('calendar-tooltip-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'calendar-tooltip-styles';
    style.textContent = `
      /* カレンダーイベントのスタイル */
      .calendar-event {
        cursor: pointer;
        border-left: 3px solid #6366f1;
        padding: 2px 4px;
        margin: 2px 0;
        border-radius: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.75rem;
        transition: background-color 0.2s;
      }
      
      .calendar-event.priority-high {
        border-left-color: #ef4444;
      }
      
      .calendar-event.priority-medium {
        border-left-color: #f59e0b;
      }
      
      .calendar-event.priority-low {
        border-left-color: #10b981;
      }
      
      .calendar-event.completed {
        text-decoration: line-through;
        opacity: 0.6;
      }
      
      .calendar-event.period-task {
        background-color: rgba(99, 102, 241, 0.1);
      }
      
      .calendar-event:hover {
        background-color: rgba(99, 102, 241, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
  
  // スタイルを追加
  addTooltipStyles();
  
  // 初期化を実行（カレンダーの読み込み後）
  setTimeout(window.initializeCalendarTooltips, 1000);
  
  // カレンダー更新後に再初期化するためのイベントリスナーを追加
  const originalUpdateCalendar = window.updateCalendar;
  if (originalUpdateCalendar) {
    window.updateCalendar = function() {
      originalUpdateCalendar();
      setTimeout(window.initializeCalendarTooltips, 100);
    };
  }
}); 
