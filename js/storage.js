// js/storage.js - Quản lý lưu trữ tiến độ học tập và ôn tập qua LocalStorage
(function() {
  const STORAGE_KEY = 'botany_study_data_2025';

  const defaultState = {
    version: '1.0',
    answers: {},       // qId -> { selectedKey, isCorrect, attempts, timestamp }
    wrongRecords: {},  // qId -> { wrongCount, lastSelected, timestamp, mastered: false, chapterId }
    bookmarks: {},     // qId -> boolean
    studyNotes: {},    // qId -> string
    settings: {
      shuffleOptions: false,
      autoNext: false,
      soundEnabled: true,
      darkMode: false
    }
  };

  class BotanyStorage {
    constructor() {
      this.state = this.loadState();
      this.listeners = [];
    }

    loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ...defaultState,
            ...parsed,
            answers: parsed.answers || {},
            wrongRecords: parsed.wrongRecords || {},
            bookmarks: parsed.bookmarks || {},
            settings: { ...defaultState.settings, ...(parsed.settings || {}) }
          };
        }
      } catch (e) {
        console.error('Lỗi khi đọc LocalStorage:', e);
      }
      return JSON.parse(JSON.stringify(defaultState));
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify('state_change', this.state);
      } catch (e) {
        console.error('Lỗi khi ghi vào LocalStorage:', e);
      }
    }

    subscribe(callback) {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }

    notify(type, data) {
      this.listeners.forEach(cb => {
        try {
          cb(type, data);
        } catch (err) {
          console.error('Lỗi listener storage:', err);
        }
      });
    }

    // Ghi nhận câu trả lời
    recordAnswer(questionId, selectedKey, isCorrect, chapterId) {
      const prevAns = this.state.answers[questionId] || { attempts: 0 };
      this.state.answers[questionId] = {
        selectedKey,
        isCorrect,
        attempts: (prevAns.attempts || 0) + 1,
        timestamp: Date.now()
      };

      // Cập nhật thống kê câu sai (Quy tắc quan trọng: không xóa lịch sử sai khi làm đúng)
      const prevWrong = this.state.wrongRecords[questionId];
      if (!isCorrect) {
        this.state.wrongRecords[questionId] = {
          wrongCount: (prevWrong ? prevWrong.wrongCount : 0) + 1,
          lastSelected: selectedKey,
          timestamp: Date.now(),
          mastered: false,
          chapterId: chapterId
        };
      } else if (prevWrong) {
        // Vẫn giữ lại số lần đã từng sai, chỉ cập nhật timestamp lần trả lời đúng gần nhất
        this.state.wrongRecords[questionId] = {
          ...prevWrong,
          lastCorrectTimestamp: Date.now(),
          lastSelected: selectedKey
        };
      }

      this.saveState();
      return this.state.answers[questionId];
    }

    // Đánh dấu đã nắm vững câu sai (người học chủ động chọn)
    toggleMastered(questionId) {
      if (this.state.wrongRecords[questionId]) {
        this.state.wrongRecords[questionId].mastered = !this.state.wrongRecords[questionId].mastered;
        this.saveState();
        return this.state.wrongRecords[questionId].mastered;
      }
      return false;
    }

    // Bookmark / Gắn sao câu hỏi
    toggleBookmark(questionId) {
      if (this.state.bookmarks[questionId]) {
        delete this.state.bookmarks[questionId];
      } else {
        this.state.bookmarks[questionId] = true;
      }
      this.saveState();
      return !!this.state.bookmarks[questionId];
    }

    isBookmarked(questionId) {
      return !!this.state.bookmarks[questionId];
    }

    getAnswer(questionId) {
      return this.state.answers[questionId] || null;
    }

    getWrongRecord(questionId) {
      return this.state.wrongRecords[questionId] || null;
    }

    // Lưu thiết lập
    updateSettings(newSettings) {
      this.state.settings = { ...this.state.settings, ...newSettings };
      this.saveState();
    }

    getSettings() {
      return this.state.settings;
    }

    // Đặt lại toàn bộ dữ liệu
    resetAll() {
      this.state = JSON.parse(JSON.stringify(defaultState));
      this.saveState();
    }

    // Đặt lại tiến độ một chương cụ thể
    resetChapter(chapterId, questionIds) {
      questionIds.forEach(id => {
        delete this.state.answers[id];
        delete this.state.wrongRecords[id];
      });
      this.saveState();
    }

    // Tính toán số liệu thống kê đầy đủ
    calculateStatistics(allQuestions, allChapters) {
      const totalQuestions = allQuestions.length;
      let totalAnswered = 0;
      let totalCorrect = 0;
      let totalIncorrect = 0;

      const chapterStats = {};
      allChapters.forEach(ch => {
        chapterStats[ch.id] = {
          id: ch.id,
          title: ch.title,
          shortTitle: ch.short_title,
          total: ch.question_count,
          answered: 0,
          correct: 0,
          incorrect: 0,
          accuracy: 0,
          wrongList: []
        };
      });

      allQuestions.forEach(q => {
        const ans = this.state.answers[q.id];
        const chStat = chapterStats[q.chapter_id];
        if (ans) {
          totalAnswered++;
          if (chStat) chStat.answered++;
          if (ans.isCorrect) {
            totalCorrect++;
            if (chStat) chStat.correct++;
          } else {
            totalIncorrect++;
            if (chStat) chStat.incorrect++;
          }
        }

        const wrongRec = this.state.wrongRecords[q.id];
        if (wrongRec && wrongRec.wrongCount > 0) {
          if (chStat) {
            chStat.wrongList.push({
              question: q,
              wrongRecord: wrongRec
            });
          }
        }
      });

      // Tính phần trăm
      const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
      const overallCompletion = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

      Object.values(chapterStats).forEach(st => {
        st.accuracy = st.answered > 0 ? Math.round((st.correct / st.answered) * 100) : 0;
        st.completion = st.total > 0 ? Math.round((st.answered / st.total) * 100) : 0;
      });

      // Top câu sai nhiều nhất
      const topWrongQuestions = [];
      Object.keys(this.state.wrongRecords).forEach(qId => {
        const rec = this.state.wrongRecords[qId];
        const q = allQuestions.find(item => item.id === qId);
        if (q && rec && rec.wrongCount > 0) {
          topWrongQuestions.push({
            question: q,
            record: rec,
            wrongCount: rec.wrongCount,
            mastered: rec.mastered
          });
        }
      });
      topWrongQuestions.sort((a, b) => b.wrongCount - a.wrongCount);

      // Các chương có tỷ lệ chính xác thấp (cần ôn tập)
      const weakChapters = Object.values(chapterStats)
        .filter(st => st.answered >= 3 && st.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy);

      return {
        totalQuestions,
        totalAnswered,
        totalCorrect,
        totalIncorrect,
        overallAccuracy,
        overallCompletion,
        chapterStats,
        topWrongQuestions,
        weakChapters,
        totalBookmarks: Object.keys(this.state.bookmarks).length,
        totalWrongRecorded: Object.keys(this.state.wrongRecords).length
      };
    }
  }

  // Khởi tạo đối tượng toàn cục
  window.BotanyStorage = new BotanyStorage();
})();
