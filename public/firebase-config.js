// Firebase設定
const firebaseConfig = {
  // ここにFirebaseプロジェクトの設定を追加してください
  apiKey: "AIzaSyDAS_hKZ1K8Raw1spf00DCk9N87bsixBdc",
  authDomain: "task-management-system-e4e3c.firebaseapp.com", 
  databaseURL: "https://task-management-system-e4e3c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "task-management-system-e4e3c",
  storageBucket: "task-management-system-e4e3c.firebasestorage.app",
  messagingSenderId: "888313433277",
  appId: "1:888313433277:web:f98accdfde3c5d3e7fbbd4"
};

// Firebase初期化
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, get, push, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// データ操作の抽象化レイヤー
class DataManager {
  constructor() {
    this.isFirebaseAvailable = true;
    this.offlineMode = false;
  }

  // データ保存（localStorageと同じインターフェース）
  async setItem(key, value) {
    try {
      if (this.isFirebaseAvailable && !this.offlineMode) {
        const dataRef = ref(database, key);
        await set(dataRef, value);
        console.log(`Firebase: ${key}を保存しました`);
      }
      // 常にlocalStorageにもバックアップ保存
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Firebase保存エラー:', error);
      // Firebaseが失敗した場合はlocalStorageに保存
      localStorage.setItem(key, value);
      this.offlineMode = true;
    }
  }

  // データ取得（localStorageと同じインターフェース）
  async getItem(key) {
    try {
      if (this.isFirebaseAvailable && !this.offlineMode) {
        const dataRef = ref(database, key);
        const snapshot = await get(dataRef);
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          console.log(`Firebase: ${key}を取得しました`);
          // localStorageにもバックアップ
          localStorage.setItem(key, firebaseData);
          return firebaseData;
        }
      }
    } catch (error) {
      console.error('Firebase取得エラー:', error);
      this.offlineMode = true;
    }
    
    // Firebaseが失敗した場合またはデータが無い場合はlocalStorageから取得
    return localStorage.getItem(key);
  }

  // データ削除
  async removeItem(key) {
    try {
      if (this.isFirebaseAvailable && !this.offlineMode) {
        const dataRef = ref(database, key);
        await remove(dataRef);
        console.log(`Firebase: ${key}を削除しました`);
      }
    } catch (error) {
      console.error('Firebase削除エラー:', error);
    }
    localStorage.removeItem(key);
  }

  // 全データクリア
  async clear() {
    try {
      if (this.isFirebaseAvailable && !this.offlineMode) {
        // 主要なデータのみ削除（全削除は危険なので避ける）
        await this.removeItem('tasks');
        await this.removeItem('businessCategories');
        await this.removeItem('offices');
      }
    } catch (error) {
      console.error('Firebase全削除エラー:', error);
    }
    localStorage.clear();
  }

  // リアルタイム同期のセットアップ
  setupRealtimeSync(key, callback) {
    try {
      if (this.isFirebaseAvailable && !this.offlineMode) {
        const dataRef = ref(database, key);
        onValue(dataRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // localStorageにもバックアップ
            localStorage.setItem(key, data);
            callback(data);
          }
        });
      }
    } catch (error) {
      console.error('リアルタイム同期エラー:', error);
    }
  }

  // 接続状態確認
  isOnline() {
    return this.isFirebaseAvailable && !this.offlineMode;
  }

  // オフラインモード切り替え
  setOfflineMode(offline) {
    this.offlineMode = offline;
  }
}

// グローバルインスタンス
window.dataManager = new DataManager();

console.log('Firebase設定が読み込まれました');

// 初期化完了イベントを発火
window.dispatchEvent(new CustomEvent('firebaseReady', {
  detail: { dataManager: window.dataManager }
}));

// より確実にするため、ウィンドウロード時にも通知
window.addEventListener('load', () => {
  console.log('Firebase DataManager が利用可能です');
  if (window.dataManager) {
    console.log('✅ Firebase接続状況:', window.dataManager.isOnline() ? 'オンライン' : 'オフライン');
  }
}); 
