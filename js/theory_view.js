// js/theory_view.js - Quản lý hiển thị lý thuyết hệ thống hóa theo chương
(function() {
  class TheoryView {
    constructor() {
      this.selectedChapterId = 1;
    }

    render() {
      const container = document.getElementById('theory-view-container');
      if (!container || !window.BOTANY_DATA) return;

      const chapters = window.BOTANY_DATA.chapters;
      const currentChapter = chapters.find(c => c.id === this.selectedChapterId) || chapters[0];

      let html = `
        <div class="max-w-5xl mx-auto px-4 py-4 md:py-6">
          <!-- Header thanh chọn chương -->
          <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>📚</span> Hệ Thống Lý Thuyết Trọng Tâm
              </h1>
              <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Kiến thức nền tảng, định nghĩa từ khóa và bảng đối chiếu theo từng chuyên đề
              </p>
            </div>

            <!-- Custom Selector chọn chương -->
            <div class="relative shrink-0">
              <select
                id="theory-chapter-select"
                onchange="window.TheoryView.selectChapter(this.value)"
                class="apple-select text-xs sm:text-sm py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                ${chapters.map(ch => `
                  <option value="${ch.id}" ${ch.id === currentChapter.id ? 'selected' : ''}>
                    ${ch.title} (${ch.question_count} câu)
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Banner tóm tắt chương hiện tại -->
          <div class="apple-card p-5 sm:p-6 mb-6 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/50">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white mb-2">
                  ${currentChapter.short_title}
                </span>
                <h2 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  ${currentChapter.title}
                </h2>
                ${currentChapter.intro ? `
                  <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                    ${currentChapter.intro}
                  </p>
                ` : ''}
              </div>

              <div class="shrink-0 flex items-center gap-2">
                <button
                  onclick="window.App.startQuiz('chapter', ${currentChapter.id})"
                  class="apple-btn apple-btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 shadow-sm">
                  <span>Luyện trắc nghiệm chương này</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Danh sách các chuyên mục và kiến thức nền -->
          <div class="space-y-6">
            ${currentChapter.sections.map(sec => {
              const qCount = sec.question_ids ? sec.question_ids.length : 0;
              return `
                <div class="apple-card p-5 sm:p-6 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
                  <!-- Tiêu đề nhóm nội dung -->
                  <div class="flex items-start sm:items-center justify-between flex-wrap gap-2 mb-3 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                        ${sec.id}
                      </span>
                      <h3 class="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        ${sec.title.replace(sec.id, '').trim()}
                      </h3>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="text-xs text-neutral-500 font-medium">
                        ${qCount} câu hỏi liên quan
                      </span>
                      <button
                        onclick="window.App.startQuiz('section', '${sec.id}', '${sec.title}')"
                        class="apple-btn apple-btn-secondary text-xs py-1 px-2.5 flex items-center gap-1">
                        <span>Luyện tập nhóm này</span>
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Nội dung lý thuyết trọng tâm -->
                  <div class="theory-content text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-3">
                    ${this.formatTheoryText(sec.theory)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Navigation giữa các chương -->
          <div class="mt-8 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            ${this.getPrevChapter() ? `
              <button
                onclick="window.TheoryView.selectChapter(${this.getPrevChapter().id})"
                class="apple-btn apple-btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                <span>${this.getPrevChapter().short_title}</span>
              </button>
            ` : '<div></div>'}

            ${this.getNextChapter() ? `
              <button
                onclick="window.TheoryView.selectChapter(${this.getNextChapter().id})"
                class="apple-btn apple-btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5">
                <span>${this.getNextChapter().short_title}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            ` : '<div></div>'}
          </div>
        </div>
      `;

      container.innerHTML = html;
    }

    selectChapter(chapterId) {
      this.selectedChapterId = Number(chapterId);
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getPrevChapter() {
      const chapters = window.BOTANY_DATA.chapters;
      const idx = chapters.findIndex(c => c.id === this.selectedChapterId);
      if (idx > 0) return chapters[idx - 1];
      return null;
    }

    getNextChapter() {
      const chapters = window.BOTANY_DATA.chapters;
      const idx = chapters.findIndex(c => c.id === this.selectedChapterId);
      if (idx >= 0 && idx < chapters.length - 1) return chapters[idx + 1];
      return null;
    }

    // Format các câu trong lý thuyết thành đoạn rõ ràng, làm nổi bật định nghĩa, tên khoa học
    formatTheoryText(rawTheory) {
      if (!rawTheory) return '<p class="text-neutral-400 italic">Nội dung đang được cập nhật.</p>';

      // Tách theo dấu chấm để tạo các bullet hoặc khối thông tin trực quan
      const sentences = rawTheory.split(/(?<=[.!?])\s+(?=[A-Z0-9À-Ỹ])/).filter(s => s.trim());

      let html = `<div class="p-4 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/40 border border-black/[0.04] dark:border-white/[0.06] space-y-2">`;
      sentences.forEach(s => {
        let formatted = s.trim();
        // Highlight Latin binomials
        formatted = formatted.replace(/\b([A-Z][a-z]+(?:\s+[a-z]+)+(?:\s+var\.\s+[a-z]+|\s+f\.\s+[a-z]+|\s+ssp\.\s+[a-z]+)?)\b/g, '<em>$1</em>');
        
        // Highlight special key terms
        formatted = formatted.replace(/(Asteraceae|Poaceae|Fabaceae|Solanaceae|Rutaceae|Brassicaceae|Cucurbitaceae|Malvaceae|Anacardiaceae|Rubiaceae|Orchidaceae|Lamiaceae|Piperaceae|Zingiberaceae|Amaranthaceae|Arecaceae|Musaceae|Bromeliaceae)/g, '<strong class="text-blue-600 dark:text-blue-400 font-bold">$1</strong>');
        formatted = formatted.replace(/(PCR|SSR|DNA barcode|CMS|matK|rbcL|ITS|PGPR|Rhizobium|Mycorrhizae|BLAST|Bootstrap)/g, '<span class="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200/50 dark:border-blue-800/50">$1</span>');

        html += `
          <div class="flex items-start gap-2">
            <span class="text-blue-500 font-bold mt-1 shrink-0">•</span>
            <div class="leading-relaxed">${formatted}</div>
          </div>
        `;
      });
      html += `</div>`;
      return html;
    }
  }

  window.TheoryView = new TheoryView();
})();
