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
      console.log('カレンダーイベントが見つかりません');
      return;
    }
    
    // 既存のツールチップリスナーを削除
    calendarEvents.forEach(event => {
      const clonedEvent = event.cloneNode(true);
      event.parentNode.replaceChild(clonedEvent, event);
    });
    
    // 新しいツールチップリスナーを設定
    document.querySelectorAll('.calendar-event').forEach(event => {
      // mouseenterイベントでツールチップを表示
      event.addEventListener('mouseenter', function() {
        // ツールチップのテキストを取得（data-title属性またはテキスト内容）
        const tooltipText = this.getAttribute('data-title') || this.textContent;
        if (!tooltipText) return;
        
        // ツールチップのテキストを改行で分割
        const tooltipLines = tooltipText.split('\n');
        
        // ツールチップ要素を作成
        const tooltip = document.createElement('div');
        tooltip.className = 'calendar-event-tooltip';
        
        // タイトル行（最初の行）を太字で表示
        const titleSpan = document.createElement('div');
        titleSpan.className = 'tooltip-title';
        titleSpan.textContent = tooltipLines[0] || '';
        tooltip.appendChild(titleSpan);
        
        // 残りの行を追加
        if (tooltipLines.length > 1) {
          const contentDiv = document.createElement('div');
          contentDiv.className = 'tooltip-content';
          
          for (let i = 1; i < tooltipLines.length; i++) {
            const line = tooltipLines[i];
            if (line) {
              const lineElem = document.createElement('div');
              lineElem.textContent = line;
              contentDiv.appendChild(lineElem);
            }
          }
          
          tooltip.appendChild(contentDiv);
        }
        
        // 優先度に応じたスタイル
        if (this.classList.contains('priority-high')) {
          tooltip.classList.add('priority-high-tooltip');
        } else if (this.classList.contains('priority-medium')) {
          tooltip.classList.add('priority-medium-tooltip');
        } else if (this.classList.contains('priority-low')) {
          tooltip.classList.add('priority-low-tooltip');
        }
        
        // 完了タスクのスタイル
        if (this.classList.contains('completed')) {
          tooltip.classList.add('completed-tooltip');
        }
        
        // ツールチップの位置を調整
        const rect = this.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        
        // 画面右端で位置調整
        if (rect.left + 300 > window.innerWidth) {
          tooltip.style.left = 'auto';
          tooltip.style.right = `${window.innerWidth - rect.right - window.scrollX + 5}px`;
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
      event.addEventListener('click', function() {
        // タスク編集ダイアログを開く（例示的なコード）
        console.log('タスクがクリックされました:', this.textContent);
        
        // タスクのIDを取得
        const taskId = this.getAttribute('data-task-id');
        if (taskId && typeof editTask === 'function') {
          // 編集ダイアログを開く
          editTask(taskId);
        }
      });
    });
    
    console.log('カレンダーツールチップの初期化が完了しました');
  };
  
  // スタイルを動的に追加
  function addTooltipStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ツールチップの基本スタイル */
      .calendar-event-tooltip {
        position: absolute;
        z-index: 9999;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 8px;
        max-width: 250px;
        font-size: 0.8rem;
        white-space: pre-wrap;
        word-break: break-word;
        pointer-events: none;
        border-top: 3px solid #6366f1;
      }
      
      /* タイトルのスタイル */
      .tooltip-title {
        font-weight: bold;
        margin-bottom: 4px;
        padding-bottom: 4px;
        border-bottom: 1px solid #eee;
      }
      
      /* コンテンツのスタイル */
      .tooltip-content {
        font-size: 0.75rem;
        line-height: 1.4;
      }
      
      /* 優先度に応じたスタイル */
      .priority-high-tooltip {
        border-top-color: #ef4444;
      }
      
      .priority-medium-tooltip {
        border-top-color: #f59e0b;
      }
      
      .priority-low-tooltip {
        border-top-color: #10b981;
      }
      
      /* 完了タスクのスタイル */
      .completed-tooltip {
        opacity: 0.7;
      }
      
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
  
  // 初期化を実行
  setTimeout(window.initializeCalendarTooltips, 1000);
}); 
