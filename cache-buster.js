// キャッシュバスター
document.addEventListener('DOMContentLoaded', function() {
  console.log('キャッシュバスター実行中...');
  
  // app.jsを動的に読み込み
  const appScript = document.createElement('script');
  appScript.src = `app.js?v=${new Date().getTime()}`;
  appScript.defer = true;
  document.head.appendChild(appScript);
  
  // calendar-tooltip.jsを動的に読み込み
  const calendarScript = document.createElement('script');
  calendarScript.src = `calendar-tooltip.js?v=${new Date().getTime()}`;
  calendarScript.defer = true;
  document.head.appendChild(calendarScript);
  
  console.log('キャッシュバスター完了');
}); 