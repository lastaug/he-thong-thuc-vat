// js/stats_view.js - Dashboard Thống kê học tập, tiến độ và phân tích kết quả
(function() {
  class StatsView {
    constructor() {}

    render() {
      const container = document.getElementById('stats-view-container');
      if (!container || !window.BOTANY_DATA) return;

      const allQuestions = window.BOTANY_DATA.questions;
      const allChapters = window.BOTANY_DATA.chapters;
      const stats = window.BotanyStorage.calculateStatistics(allQuestions, allChapters);

      // Đánh giá mức độ thành thạo
      let readinessBadge = { text: "Mới bắt đầu", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300" };
      if (stats.totalAnswered >= 50) {
        if (stats.overallAccuracy >= 85) {
          readinessBadge = { text: "Sẵn sàng đạt điểm A+", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" };
        } else if (stats.overallAccuracy >= 70) {
          readinessBadge = { text: "Đạt chuẩn khá giỏi", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" };
        } else {
          readinessBadge = { text: "Cần tăng cường ôn tập", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" };
        }
      }

      let html = `
        <div class="max-w-5xl mx-auto px-4 py-4 md:py-6">
          <!-- Header Thống kê -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>📊</span> Thống Kê & Phân Tích Tiến Độ Học Tập
              </h1>
              <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Số liệu tính toán tự động từ toàn bộ 334 câu hỏi và lịch sử làm bài thực tế
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${readinessBadge.color}">
                ${readinessBadge.text}
              </span>
              <button
                onclick="window.StatsView.confirmReset()"
                class="apple-btn apple-btn-secondary text-xs py-1.5 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                Đặt lại tiến độ
              </button>
            </div>
          </div>

          <!-- 4 Card chỉ số tổng quan (Above the fold, tối ưu viewport laptop) -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div class="apple-card p-4 sm:p-5">
              <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Tổng câu đã làm</div>
              <div class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                ${stats.totalAnswered} <span class="text-xs font-normal text-neutral-400">/ ${stats.totalQuestions}</span>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <div class="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-blue-600 h-full rounded-full" style="width: ${stats.overallCompletion}%"></div>
                </div>
                <span class="text-xs font-bold text-neutral-600 dark:text-neutral-400">${stats.overallCompletion}%</span>
              </div>
            </div>

            <div class="apple-card p-4 sm:p-5">
              <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Tỷ lệ chính xác</div>
              <div class="text-2xl sm:text-3xl font-extrabold ${stats.overallAccuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'}">
                ${stats.overallAccuracy}%
              </div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                ${stats.totalAnswered > 0 ? `Đúng ${stats.totalCorrect} câu` : 'Chưa có dữ liệu'}
              </div>
            </div>

            <div class="apple-card p-4 sm:p-5">
              <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Câu trả lời sai</div>
              <div class="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                ${stats.totalIncorrect}
              </div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                ${stats.totalWrongRecorded} câu trong danh sách cần ôn
              </div>
            </div>

            <div class="apple-card p-4 sm:p-5">
              <div class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Đã gắn sao lưu ý</div>
              <div class="text-2xl sm:text-3xl font-extrabold text-amber-500">
                ${stats.totalBookmarks}
              </div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                <button onclick="window.App.startQuiz('bookmarked')" class="text-blue-600 dark:text-blue-400 hover:underline">
                  Xem danh sách →
                </button>
              </div>
            </div>
          </div>

          <!-- Cảnh báo các chương kết quả thấp (nếu có) -->
          ${stats.weakChapters.length > 0 ? `
            <div class="apple-card p-5 mb-6 bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60">
              <div class="flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-200 font-bold text-sm">
                <svg class="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>Chương có tỷ lệ chính xác dưới 70% (Cần chú ý ôn tập kỹ):</span>
              </div>
              <div class="flex flex-wrap gap-2 mt-2">
                ${stats.weakChapters.map(st => `
                  <button
                    onclick="window.App.startQuiz('chapter', ${st.id})"
                    class="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-900 dark:text-rose-200 hover:shadow-sm flex items-center gap-2 transition-all">
                    <span>${st.shortTitle}: <strong>${st.accuracy}% đúng</strong></span>
                    <span class="text-blue-600 dark:text-blue-400">Ôn ngay →</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Bảng tiến độ từng chương -->
          <div class="apple-card p-5 sm:p-6 mb-6">
            <h2 class="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <span>📋</span> Tiến Độ Chi Tiết Từng Chương
            </h2>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr class="border-b border-black/[0.06] dark:border-white/[0.08] text-neutral-400 uppercase text-[11px] font-bold">
                    <th class="py-2.5 px-3">Chương</th>
                    <th class="py-2.5 px-3 text-center">Tổng câu</th>
                    <th class="py-2.5 px-3 text-center">Đã làm</th>
                    <th class="py-2.5 px-3">Tiến độ</th>
                    <th class="py-2.5 px-3 text-center">Đúng</th>
                    <th class="py-2.5 px-3 text-center">Sai</th>
                    <th class="py-2.5 px-3 text-center">Tỷ lệ</th>
                    <th class="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  ${allChapters.map(ch => {
                    const st = stats.chapterStats[ch.id];
                    let accColor = "text-neutral-500";
                    if (st.answered > 0) {
                      accColor = st.accuracy >= 80 ? "text-emerald-600 dark:text-emerald-400 font-bold" : (st.accuracy >= 60 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-rose-600 dark:text-rose-400 font-bold");
                    }

                    return `
                      <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td class="py-3 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                          <span class="block text-xs text-neutral-400 font-normal">${ch.short_title}</span>
                          <span class="truncate block max-w-xs">${ch.title}</span>
                        </td>
                        <td class="py-3 px-3 text-center font-bold text-neutral-700 dark:text-neutral-300">
                          ${ch.question_count}
                        </td>
                        <td class="py-3 px-3 text-center text-neutral-600 dark:text-neutral-400">
                          ${st.answered}
                        </td>
                        <td class="py-3 px-3 min-w-[120px]">
                          <div class="flex items-center gap-2">
                            <div class="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                              <div class="bg-blue-600 h-full rounded-full" style="width: ${st.completion}%"></div>
                            </div>
                            <span class="text-[11px] text-neutral-500 shrink-0 font-medium">${st.completion}%</span>
                          </div>
                        </td>
                        <td class="py-3 px-3 text-center font-medium text-emerald-600 dark:text-emerald-400">
                          ${st.correct}
                        </td>
                        <td class="py-3 px-3 text-center font-medium text-rose-600 dark:text-rose-400">
                          ${st.incorrect}
                        </td>
                        <td class="py-3 px-3 text-center ${accColor}">
                          ${st.answered > 0 ? `${st.accuracy}%` : '-'}
                        </td>
                        <td class="py-3 px-3 text-right">
                          <button
                            onclick="window.App.startQuiz('chapter', ${ch.id})"
                            class="apple-btn apple-btn-secondary text-xs py-1 px-2.5 font-medium">
                            Ôn tập
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top các câu hỏi sai nhiều nhất -->
          ${stats.topWrongQuestions.length > 0 ? `
            <div class="apple-card p-5 sm:p-6 mb-6">
              <h2 class="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                <span>⚠️</span> Top Những Câu Hỏi Thường Xuyên Trả Lời Sai
              </h2>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                Những câu hỏi bạn đã sai nhiều lần nhất trong quá trình luyện tập
              </p>

              <div class="space-y-3">
                ${stats.topWrongQuestions.slice(0, 10).map(item => {
                  const q = item.question;
                  return `
                    <div class="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                      <div>
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-xs font-bold text-blue-600 dark:text-blue-400">${q.original_num}</span>
                          <span class="text-[11px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                            Đã sai ${item.wrongCount} lần
                          </span>
                          <span class="text-xs text-neutral-400">${q.chapter_short}</span>
                        </div>
                        <h4 class="text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2">
                          ${q.question}
                        </h4>
                      </div>

                      <button
                        onclick="window.App.startSingleQuiz('${q.id}')"
                        class="apple-btn apple-btn-secondary text-xs py-1 px-2.5 shrink-0 text-blue-600 dark:text-blue-400 font-semibold">
                        Làm lại
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      container.innerHTML = html;
    }

    confirmReset() {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ lịch sử và tiến độ học tập không? Dữ liệu đã làm sẽ được làm mới.')) {
        window.BotanyStorage.resetAll();
        this.render();
        alert('Đã đặt lại tiến độ thành công!');
      }
    }
  }

  window.StatsView = new StatsView();
})();
