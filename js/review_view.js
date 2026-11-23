// js/review_view.js - Quản lý ôn tập câu làm sai và Spaced Repetition
(function() {
  class ReviewView {
    constructor() {
      this.selectedChapterFilter = 'all';
      this.filterStatus = 'all'; // 'all' | 'multiple' | 'unmastered'
    }

    render() {
      const container = document.getElementById('review-view-container');
      if (!container || !window.BOTANY_DATA) return;

      const allQuestions = window.BOTANY_DATA.questions;
      const chapters = window.BOTANY_DATA.chapters;
      const wrongRecords = window.BotanyStorage.state.wrongRecords;

      // Gom danh sách các câu đã từng làm sai
      const wrongList = [];
      Object.keys(wrongRecords).forEach(qId => {
        const rec = wrongRecords[qId];
        const q = allQuestions.find(item => item.id === qId);
        if (q && rec && rec.wrongCount > 0) {
          wrongList.push({
            question: q,
            record: rec
          });
        }
      });

      // Lọc theo chương
      let filtered = wrongList;
      if (this.selectedChapterFilter !== 'all') {
        const chId = Number(this.selectedChapterFilter);
        filtered = filtered.filter(item => item.question.chapter_id === chId);
      }

      // Lọc theo trạng thái
      if (this.filterStatus === 'multiple') {
        filtered = filtered.filter(item => item.record.wrongCount >= 2);
      } else if (this.filterStatus === 'unmastered') {
        filtered = filtered.filter(item => !item.record.mastered);
      }

      // Sắp xếp: ưu tiên số lần sai nhiều nhất lên đầu
      filtered.sort((a, b) => b.record.wrongCount - a.record.wrongCount);

      const totalWrongCount = wrongList.length;

      let html = `
        <div class="max-w-5xl mx-auto px-4 py-4 md:py-6">
          <!-- Top Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>🔄</span> Ôn Tập & Khắc Phục Câu Sai
              </h1>
              <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Lịch sử ghi nhận tổng cộng <strong>${totalWrongCount}</strong> câu từng trả lời sai
              </p>
            </div>

            ${totalWrongCount > 0 ? `
              <button
                onclick="window.App.startQuiz('wrong', '${this.selectedChapterFilter}')"
                class="apple-btn apple-btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 shadow-sm shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Luyện lại các câu này (${filtered.length})</span>
              </button>
            ` : ''}
          </div>

          <!-- Bộ lọc danh mục chương và mức độ -->
          <div class="apple-card p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Lọc theo chương:</span>
              <select
                onchange="window.ReviewView.setChapterFilter(this.value)"
                class="apple-select text-xs py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                <option value="all" ${this.selectedChapterFilter === 'all' ? 'selected' : ''}>Tất cả các chương (${totalWrongCount})</option>
                ${chapters.map(ch => {
                  const cnt = wrongList.filter(item => item.question.chapter_id === ch.id).length;
                  return `
                    <option value="${ch.id}" ${this.selectedChapterFilter === String(ch.id) ? 'selected' : ''}>
                      ${ch.short_title} (${cnt} câu sai)
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                onclick="window.ReviewView.setStatusFilter('all')"
                class="px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${this.filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}">
                Tất cả (${wrongList.length})
              </button>
              <button
                onclick="window.ReviewView.setStatusFilter('multiple')"
                class="px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${this.filterStatus === 'multiple' ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}">
                Sai ≥ 2 lần
              </button>
              <button
                onclick="window.ReviewView.setStatusFilter('unmastered')"
                class="px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${this.filterStatus === 'unmastered' ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}">
                Chưa nắm vững
              </button>
            </div>
          </div>

          <!-- Danh sách câu sai -->
          ${filtered.length === 0 ? `
            <div class="apple-card p-12 text-center my-6">
              <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                Tuyệt vời! Không có câu hỏi nào trong danh sách này
              </h3>
              <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                Bạn chưa làm sai câu nào ở bộ lọc này, hoặc tất cả đều đã được khắc phục. Hãy tiếp tục luyện tập thêm các chương khác nhé!
              </p>
            </div>
          ` : `
            <div class="space-y-4">
              ${filtered.map(item => {
                const q = item.question;
                const rec = item.record;
                return `
                  <div class="apple-card p-5 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
                    <div class="flex items-start justify-between gap-3 mb-2.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold text-blue-600 dark:text-blue-400">
                          ${q.original_num}
                        </span>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          ${q.chapter_short}
                        </span>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${rec.wrongCount >= 2 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}">
                          Đã sai ${rec.wrongCount} lần
                        </span>
                        ${rec.mastered ? `
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Đã nắm vững
                          </span>
                        ` : ''}
                      </div>

                      <div class="flex items-center gap-2">
                        <button
                          onclick="window.ReviewView.toggleMastered('${q.id}')"
                          class="apple-btn apple-btn-secondary text-xs py-1 px-2.5 ${rec.mastered ? 'text-emerald-600 dark:text-emerald-400' : ''}"
                          title="Đánh dấu câu này đã nhớ kỹ">
                          ${rec.mastered ? '✓ Đã nắm vững' : 'Đánh dấu đã hiểu'}
                        </button>
                        <button
                          onclick="window.App.startSingleQuiz('${q.id}')"
                          class="apple-btn apple-btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                          <span>Làm lại câu này</span>
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Nội dung câu hỏi -->
                    <h3 class="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3 leading-snug">
                      ${q.question}
                    </h3>

                    <!-- Tóm tắt đáp án đúng & giải thích -->
                    <div class="text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
                      <div class="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        <span>Đáp án đúng: <strong class="uppercase">${q.correct_key}. ${q.options.find(o => o.key.toLowerCase() === q.correct_key.toLowerCase())?.text || ''}</strong></span>
                      </div>
                      ${q.general_explanation ? `
                        <div class="text-neutral-600 dark:text-neutral-300 text-xs leading-relaxed pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                          ${q.general_explanation}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      container.innerHTML = html;
    }

    setChapterFilter(val) {
      this.selectedChapterFilter = val;
      this.render();
    }

    setStatusFilter(val) {
      this.filterStatus = val;
      this.render();
    }

    toggleMastered(qId) {
      window.BotanyStorage.toggleMastered(qId);
      this.render();
    }
  }

  window.ReviewView = new ReviewView();
})();
