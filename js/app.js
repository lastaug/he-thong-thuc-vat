// js/app.js - Điều phối ứng dụng, định tuyến tab và khởi tạo
(function() {
  class BotanyApp {
    constructor() {
      this.currentTab = 'chapters'; // 'chapters' | 'theory' | 'quiz' | 'review' | 'stats'
    }

    init() {
      // Thiết lập dark mode từ storage
      const settings = window.BotanyStorage.getSettings();
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Lắng nghe thay đổi storage để cập nhật badge số câu sai trên header
      window.BotanyStorage.subscribe(() => {
        this.updateHeaderBadges();
      });

      this.updateHeaderBadges();
      this.renderChaptersView();
      this.switchTab('chapters');
    }

    toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      window.BotanyStorage.updateSettings({ darkMode: isDark });
    }

    updateHeaderBadges() {
      const wrongCount = Object.keys(window.BotanyStorage.state.wrongRecords).length;
      const wrongBadge = document.getElementById('header-wrong-count');
      if (wrongBadge) {
        wrongBadge.textContent = wrongCount;
        wrongBadge.style.display = wrongCount > 0 ? 'inline-flex' : 'none';
      }

      const bookmarkedCount = Object.keys(window.BotanyStorage.state.bookmarks).length;
      const starBadge = document.getElementById('header-star-count');
      if (starBadge) {
        starBadge.textContent = bookmarkedCount;
        starBadge.style.display = bookmarkedCount > 0 ? 'inline-flex' : 'none';
      }
    }

    switchTab(tabId) {
      this.currentTab = tabId;

      // Ẩn tất cả view
      const views = ['chapters-view', 'theory-view', 'quiz-view', 'review-view', 'stats-view'];
      views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.classList.add('hidden');
      });

      // Bỏ active tất cả nav links
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Hiện view được chọn
      const targetView = document.getElementById(`${tabId}-view`);
      if (targetView) targetView.classList.remove('hidden');

      const activeNavBtn = document.getElementById(`nav-${tabId}`);
      if (activeNavBtn) activeNavBtn.classList.add('active');

      // Kích hoạt render view tương ứng
      if (tabId === 'chapters') {
        this.renderChaptersView();
      } else if (tabId === 'theory') {
        window.TheoryView.render();
      } else if (tabId === 'quiz') {
        if (!window.QuizEngine.questions || window.QuizEngine.questions.length === 0) {
          window.QuizEngine.initSession('chapter', 1);
        } else {
          window.QuizEngine.render();
        }
      } else if (tabId === 'review') {
        window.ReviewView.render();
      } else if (tabId === 'stats') {
        window.StatsView.render();
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Bắt đầu quiz theo chương hoặc toàn bộ
    startQuiz(mode, filterId, title) {
      window.QuizEngine.initSession(mode, filterId, title);
      this.switchTab('quiz');
    }

    // Làm bài trực tiếp cho 1 câu cụ thể (làm lại từ đầu câu này)
    startSingleQuiz(qId) {
      window.QuizEngine.initSession('single', qId);
      this.switchTab('quiz');
    }

    // Render danh sách 11 chương trên trang chủ
    renderChaptersView() {
      const container = document.getElementById('chapters-view-container');
      if (!container || !window.BOTANY_DATA) return;

      const chapters = window.BOTANY_DATA.chapters;
      const allQuestions = window.BOTANY_DATA.questions;
      const stats = window.BotanyStorage.calculateStatistics(allQuestions, chapters);

      let html = `
        <div class="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <!-- Hero Section -->
          <div class="apple-card p-6 sm:p-8 mb-8 text-center bg-gradient-to-b from-blue-50/50 via-white to-transparent dark:from-blue-950/20 dark:via-neutral-900 dark:to-transparent border-neutral-200/80 dark:border-neutral-800">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 mb-3">
              Trường Đại Học Nông Lâm TP. Hồ Chí Minh • 2025
            </span>
            <h1 class="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight mb-3">
              Ôn Tập Hệ Thống Thực Vật
            </h1>
            <p class="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-6 leading-relaxed">
              Trọn bộ <strong>334 câu hỏi trắc nghiệm</strong> và <strong>46 chuyên đề lý thuyết</strong> trọng tâm, có giải thích chuyên sâu từng phương án và lưu ý đối chiếu giáo trình.
            </p>

            <!-- Nút hành động nhanh -->
            <div class="flex items-center justify-center gap-3 flex-wrap">
              <button
                onclick="window.App.startQuiz('chapter', 'all')"
                class="apple-btn apple-btn-primary px-5 py-2.5 text-sm font-bold shadow-md flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Luyện toàn bộ 334 câu</span>
              </button>
              <button
                onclick="window.App.switchTab('theory')"
                class="apple-btn apple-btn-secondary px-5 py-2.5 text-sm font-medium flex items-center gap-2">
                <span>Tra cứu lý thuyết</span>
              </button>
              <button
                onclick="window.App.switchTab('review')"
                class="apple-btn apple-btn-secondary px-5 py-2.5 text-sm font-medium flex items-center gap-2">
                <span>Ôn lại câu sai</span>
                <span class="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                  ${stats.totalWrongRecorded}
                </span>
              </button>
            </div>
          </div>

          <!-- Lưới 11 chương học -->
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>📂</span> Danh Sách 11 Chương Trọng Tâm
            </h2>
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Hoàn thành: ${stats.totalAnswered}/${stats.totalQuestions} câu (${stats.overallCompletion}%)
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            ${chapters.map(ch => {
              const chStat = stats.chapterStats[ch.id];
              return `
                <div class="apple-card p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        ${ch.short_title}
                      </span>
                      <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        ${ch.question_count} câu
                      </span>
                    </div>

                    <h3 class="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
                      ${ch.title}
                    </h3>

                    <p class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4">
                      ${ch.sections.map(s => s.title.replace(s.id, '').trim()).join(' • ')}
                    </p>
                  </div>

                  <div>
                    <!-- Thanh tiến trình chương -->
                    <div class="mb-4">
                      <div class="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                        <span>Tiến độ</span>
                        <span>${chStat.answered}/${ch.question_count} (${chStat.completion}%)</span>
                      </div>
                      <div class="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-blue-600 h-full rounded-full transition-all" style="width: ${chStat.completion}%"></div>
                      </div>
                    </div>

                    <!-- Nút thao tác -->
                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                      <button
                        onclick="window.TheoryView.selectChapter(${ch.id}); window.App.switchTab('theory');"
                        class="apple-btn apple-btn-secondary text-xs py-2 text-center font-medium">
                        Lý thuyết
                      </button>
                      <button
                        onclick="window.App.startQuiz('chapter', ${ch.id})"
                        class="apple-btn apple-btn-secondary text-xs py-2 text-center font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                        Làm trắc nghiệm
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      container.innerHTML = html;
    }

    // Modal tìm kiếm toàn bộ ngân hàng câu hỏi
    openSearchModal() {
      const modal = document.getElementById('search-modal');
      const input = document.getElementById('search-input');
      if (modal) {
        modal.classList.remove('hidden');
        if (input) {
          input.value = '';
          input.focus();
        }
        this.handleSearch('');
      }
    }

    closeSearchModal() {
      const modal = document.getElementById('search-modal');
      if (modal) modal.classList.add('hidden');
    }

    handleSearch(query) {
      const resultsContainer = document.getElementById('search-results');
      if (!resultsContainer || !window.BOTANY_DATA) return;

      const qTrim = query.trim().toLowerCase();
      if (!qTrim) {
        resultsContainer.innerHTML = '<p class="text-xs text-neutral-400 p-4 text-center">Nhập từ khóa (tên cây, tên khoa học, họ thực vật, khái niệm...) để tìm kiếm</p>';
        return;
      }

      const allQ = window.BOTANY_DATA.questions;
      const matches = allQ.filter(q => {
        return q.question.toLowerCase().includes(qTrim) ||
               q.answer_text.toLowerCase().includes(qTrim) ||
               q.general_explanation.toLowerCase().includes(qTrim) ||
               (q.note && q.note.toLowerCase().includes(qTrim)) ||
               q.options.some(opt => opt.text.toLowerCase().includes(qTrim));
      }).slice(0, 15);

      if (matches.length === 0) {
        resultsContainer.innerHTML = '<p class="text-xs text-neutral-400 p-4 text-center">Không tìm thấy câu hỏi phù hợp.</p>';
        return;
      }

      resultsContainer.innerHTML = matches.map(q => `
        <div
          onclick="window.App.closeSearchModal(); window.App.startSingleQuiz('${q.id}');"
          class="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 cursor-pointer transition-colors mb-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-blue-600 dark:text-blue-400">${q.original_num}</span>
            <span class="text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">${q.chapter_short}</span>
          </div>
          <p class="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2">
            ${q.question}
          </p>
        </div>
      `).join('');
    }
  }

  window.App = new BotanyApp();
  document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
  });
})();
