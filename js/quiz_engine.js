// js/quiz_engine.js - Bộ điều khiển logic làm bài trắc nghiệm tương tác
(function() {
  class QuizEngine {
    constructor() {
      this.questions = [];
      this.currentIndex = 0;
      this.mode = 'chapter'; // 'chapter' | 'all' | 'wrong' | 'bookmarked' | 'section'
      this.filterId = null;
      this.title = 'Trắc nghiệm theo chương';
      this.audioContext = null;
    }

    // Phát âm thanh phản hồi nhẹ bằng Web Audio API
    playFeedbackSound(isCorrect) {
      if (!window.BotanyStorage.getSettings().soundEnabled) return;
      try {
        if (!this.audioContext) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.audioContext = new AudioContext();
        }
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        if (isCorrect) {
          // Âm thanh ngọt ngào xác nhận đúng (chord F -> A)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.setValueAtTime(880, now + 0.08); // A5
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else {
          // Âm thanh báo sai nhẹ nhàng
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.setValueAtTime(240, now + 0.09);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
        }
      } catch (e) {
        // Silent catch for audio policy
      }
    }

    // Khởi động phiên làm bài
    initSession(mode = 'chapter', filterId = null, title = null) {
      this.mode = mode;
      this.filterId = filterId;
      const allQ = window.BOTANY_DATA ? window.BOTANY_DATA.questions : [];

      if (mode === 'chapter') {
        if (filterId === 'all') {
          this.questions = [...allQ];
          this.title = 'Toàn bộ ngân hàng (334 câu)';
        } else {
          const chId = filterId ? Number(filterId) : 1;
          this.questions = allQ.filter(q => q.chapter_id === chId);
          const chObj = window.BOTANY_DATA.chapters.find(c => c.id === chId);
          this.title = chObj ? chObj.title : `Chương ${chId}`;
        }
      } else if (mode === 'section') {
        this.questions = allQ.filter(q => q.section_id === filterId);
        const secObj = window.BOTANY_DATA.sections.find(s => s.id === filterId);
        this.title = secObj ? secObj.title : `Mục ${filterId}`;
      } else if (mode === 'wrong') {
        const wrongRecords = window.BotanyStorage.state.wrongRecords;
        this.questions = allQ.filter(q => {
          const rec = wrongRecords[q.id];
          return rec && rec.wrongCount > 0;
        });
        if (filterId && filterId !== 'all') {
          const chId = Number(filterId);
          this.questions = this.questions.filter(q => q.chapter_id === chId);
        }
        this.title = title || 'Ôn tập câu làm sai';
      } else if (mode === 'bookmarked') {
        this.questions = allQ.filter(q => window.BotanyStorage.isBookmarked(q.id));
        this.title = 'Danh sách câu hỏi đã gắn sao';
      }

      this.currentIndex = 0;
      this.render();
    }

    getCurrentQuestion() {
      if (!this.questions || this.questions.length === 0) return null;
      return this.questions[this.currentIndex];
    }

    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
        this.render();
      }
    }

    prevQuestion() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.render();
      }
    }

    jumpToIndex(index) {
      if (index >= 0 && index < this.questions.length) {
        this.currentIndex = index;
        this.render();
      }
    }

    // Xử lý khi người học chọn đáp án
    handleSelectOption(optionKey) {
      const q = this.getCurrentQuestion();
      if (!q) return;

      const isCorrect = (optionKey.toLowerCase() === q.correct_key.toLowerCase());
      window.BotanyStorage.recordAnswer(q.id, optionKey, isCorrect, q.chapter_id);
      this.playFeedbackSound(isCorrect);
      this.render();

      // Nếu bật tính năng tự chuyển câu và làm đúng
      const settings = window.BotanyStorage.getSettings();
      if (settings.autoNext && isCorrect && this.currentIndex < this.questions.length - 1) {
        setTimeout(() => {
          this.nextQuestion();
        }, 1200);
      }
    }

    // Render giao diện câu hỏi
    render() {
      const container = document.getElementById('quiz-view-container');
      if (!container) return;

      const q = this.getCurrentQuestion();
      if (!q) {
        container.innerHTML = `
          <div class="apple-card p-8 text-center max-w-xl mx-auto my-12">
            <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Không có câu hỏi nào trong mục này</h3>
            <p class="text-neutral-600 dark:text-neutral-400 text-sm mb-6">Bạn đã nắm vững toàn bộ kiến thức hoặc chưa chọn câu hỏi ôn tập.</p>
            <button onclick="window.App.switchTab('chapters')" class="apple-btn apple-btn-primary">
              Chọn chương khác để học
            </button>
          </div>
        `;
        return;
      }

      const total = this.questions.length;
      const progressPercent = Math.round(((this.currentIndex + 1) / total) * 100);
      const ansRecord = window.BotanyStorage.getAnswer(q.id);
      const wrongRec = window.BotanyStorage.getWrongRecord(q.id);
      const isBookmarked = window.BotanyStorage.isBookmarked(q.id);
      const isAnswered = !!ansRecord;

      let html = `
        <div class="max-w-4xl mx-auto px-4 py-4 md:py-6">
          <!-- Top Bar: Tiêu đề chương & Bộ điều khiển nhanh -->
          <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-black/[0.06] dark:border-white/[0.08]">
                ${q.chapter_short || 'Chương'}
              </span>
              <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                ${q.section_title || ''}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <!-- Nút Bookmark sao -->
              <button onclick="window.QuizEngine.toggleCurrentBookmark()" class="apple-icon-btn ${isBookmarked ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' : ''}" title="Gắn sao ghi nhớ">
                <svg class="w-4 h-4" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </button>

              <!-- Nút Mở ngăn kéo Grid câu hỏi -->
              <button onclick="window.QuizEngine.openQuestionGrid()" class="apple-btn apple-btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                <svg class="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                <span>Câu ${this.currentIndex + 1}/${total}</span>
              </button>
            </div>
          </div>

          <!-- Thanh tiến trình câu hỏi -->
          <div class="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-5">
            <div class="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
          </div>

          <!-- Card câu hỏi chính -->
          <div class="apple-card p-5 sm:p-7 mb-5 transition-all">
            <!-- Header câu hỏi: Số câu & Badge trạng thái -->
            <div class="flex items-center justify-between mb-3.5 gap-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
                  ${q.original_num || ('Câu ' + (this.currentIndex + 1))}
                </span>
                ${q.has_note ? `
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80" title="Câu có lưu ý đối chiếu giáo trình & đề thi">
                    Đối chiếu giáo trình
                  </span>
                ` : `
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-black/[0.04] dark:border-white/[0.06]">
                    Đề cương chính thức
                  </span>
                `}
              </div>

              ${wrongRec && wrongRec.wrongCount > 0 ? `
                <span class="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Đã sai ${wrongRec.wrongCount} lần
                </span>
              ` : ''}
            </div>

            <!-- Nội dung câu hỏi -->
            <h2 class="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 leading-relaxed">
              ${this.highlightKeywords(q.question)}
            </h2>

            <!-- Danh sách 4 phương án lựa chọn A, B, C, D -->
            <div class="space-y-3">
              ${q.options.map(opt => {
                const optKey = opt.key.toLowerCase();
                const isSelected = ansRecord && (ansRecord.selectedKey.toLowerCase() === optKey);
                const isCorrectOpt = (optKey === q.correct_key.toLowerCase());

                let optClass = "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/60 text-neutral-800 dark:text-neutral-200";
                let badgeClass = "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
                let iconHtml = "";

                if (isAnswered) {
                  if (isCorrectOpt) {
                    optClass = "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30";
                    badgeClass = "bg-emerald-600 text-white border-emerald-600";
                    iconHtml = `
                      <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    `;
                  } else if (isSelected && !isCorrectOpt) {
                    optClass = "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500/30";
                    badgeClass = "bg-rose-600 text-white border-rose-600";
                    iconHtml = `
                      <svg class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    `;
                  } else {
                    optClass = "opacity-60 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30 text-neutral-600 dark:text-neutral-400";
                  }
                }

                return `
                  <button
                    onclick="window.QuizEngine.handleSelectOption('${optKey}')"
                    class="w-full text-left p-3.5 sm:p-4 rounded-xl border flex items-center justify-between transition-all duration-150 apple-btn-press ${optClass}">
                    <div class="flex items-center gap-3">
                      <span class="w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs uppercase shrink-0 transition-colors ${badgeClass}">
                        ${optKey}
                      </span>
                      <span class="text-sm sm:text-base font-medium leading-snug">
                        ${this.formatScientificName(opt.text)}
                      </span>
                    </div>
                    ${iconHtml}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Hộp Giải thích chi tiết (Hiển thị ngay sau khi trả lời) -->
            ${isAnswered ? `
              <div class="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.08] animate-fade-in">
                <!-- Thông báo Đúng / Sai tức thì -->
                <div class="flex items-center gap-2 mb-3">
                  ${ansRecord.isCorrect ? `
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      Chính xác!
                    </div>
                  ` : `
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                      Chưa chính xác
                    </div>
                  `}
                  <span class="text-xs text-neutral-500 dark:text-neutral-400">
                    Đáp án đúng: <strong class="text-emerald-600 dark:text-emerald-400 font-bold uppercase">${q.correct_key}. ${q.options.find(o => o.key.toLowerCase() === q.correct_key.toLowerCase())?.text || ''}</strong>
                  </span>
                </div>

                <!-- Cảnh báo Lưu ý (nếu có đối chiếu giáo trình) -->
                ${q.note ? `
                  <div class="p-3.5 mb-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-relaxed flex items-start gap-2.5">
                    <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <strong class="font-bold block mb-0.5">Lưu ý chuyên môn:</strong>
                      ${q.note}
                    </div>
                  </div>
                ` : ''}

                <!-- Giải thích chung -->
                ${q.general_explanation ? `
                  <div class="mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] leading-relaxed">
                    <span class="font-bold text-neutral-900 dark:text-neutral-100 block mb-1">Giải thích chung:</span>
                    ${q.general_explanation}
                  </div>
                ` : ''}

                <!-- Phân tích từng phương án chi tiết A, B, C, D -->
                <div class="space-y-2 text-xs sm:text-sm">
                  <span class="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">Phân tích từng phương án:</span>
                  ${q.options.map(opt => {
                    const isOptCorrect = opt.explanation.includes('ĐÚNG');
                    return `
                      <div class="flex items-start gap-2 text-neutral-600 dark:text-neutral-300">
                        <span class="font-bold uppercase text-neutral-700 dark:text-neutral-300 w-4 shrink-0">${opt.key}.</span>
                        <div class="leading-relaxed">
                          <strong class="${isOptCorrect ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-neutral-800 dark:text-neutral-200 font-medium'}">${this.formatScientificName(opt.text)}:</strong>
                          <span class="ml-1">${this.formatExplanationTag(opt.explanation)}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Bottom Navigation Bar: Nút Câu trước / Câu tiếp theo -->
          <div class="flex items-center justify-between gap-3">
            <button
              onclick="window.QuizEngine.prevQuestion()"
              ${this.currentIndex === 0 ? 'disabled' : ''}
              class="apple-btn apple-btn-secondary px-4 py-2.5 text-sm flex items-center gap-1.5 ${this.currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              <span>Câu trước</span>
            </button>

            <span class="text-xs font-semibold text-neutral-400">
              ${this.currentIndex + 1} / ${total}
            </span>

            <button
              onclick="window.QuizEngine.nextQuestion()"
              ${this.currentIndex >= total - 1 ? 'disabled' : ''}
              class="apple-btn apple-btn-primary px-5 py-2.5 text-sm flex items-center gap-1.5 ${this.currentIndex >= total - 1 ? 'opacity-40 cursor-not-allowed' : ''}">
              <span>Câu tiếp</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      `;

      container.innerHTML = html;
    }

    toggleCurrentBookmark() {
      const q = this.getCurrentQuestion();
      if (q) {
        window.BotanyStorage.toggleBookmark(q.id);
        this.render();
      }
    }

    // Hiển thị ngăn kéo / Drawer danh sách tất cả các câu
    openQuestionGrid() {
      const q = this.getCurrentQuestion();
      const modal = document.getElementById('grid-modal');
      const gridContainer = document.getElementById('grid-modal-list');
      if (!modal || !gridContainer) return;

      const items = this.questions.map((item, idx) => {
        const ans = window.BotanyStorage.getAnswer(item.id);
        const isCurrent = idx === this.currentIndex;
        let bg = "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700";
        if (ans) {
          if (ans.isCorrect) {
            bg = "bg-emerald-500 text-white border-emerald-600";
          } else {
            bg = "bg-rose-500 text-white border-rose-600";
          }
        }
        const currentRing = isCurrent ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-neutral-900" : "";

        return `
          <button
            onclick="window.QuizEngine.jumpFromGrid(${idx})"
            class="w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border transition-all apple-btn-press ${bg} ${currentRing}">
            ${item.num || (idx + 1)}
          </button>
        `;
      }).join('');

      gridContainer.innerHTML = items;
      modal.classList.remove('hidden');
    }

    closeQuestionGrid() {
      const modal = document.getElementById('grid-modal');
      if (modal) modal.classList.add('hidden');
    }

    jumpFromGrid(idx) {
      this.closeQuestionGrid();
      this.jumpToIndex(idx);
    }

    // Tiện ích format tên khoa học (in nghiêng chữ La-tinh)
    formatScientificName(text) {
      if (!text) return '';
      // Nhận diện các từ viết hoa loài như Oryza sativa, Zea mays, v.v.
      return text.replace(/\b([A-Z][a-z]+(?:\s+[a-z]+)+(?:\s+var\.\s+[a-z]+|\s+f\.\s+[a-z]+|\s+ssp\.\s+[a-z]+)?)\b/g, (match) => {
        return `<em>${match}</em>`;
      });
    }

    highlightKeywords(text) {
      if (!text) return '';
      return this.formatScientificName(text);
    }

    formatExplanationTag(expl) {
      if (!expl) return '';
      let formatted = expl;
      if (formatted.startsWith('ĐÚNG.')) {
        formatted = `<span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mr-1">ĐÚNG</span> ` + formatted.substring(5).trim();
      } else if (formatted.startsWith('SAI.')) {
        formatted = `<span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 mr-1">SAI</span> ` + formatted.substring(4).trim();
      }
      return this.formatScientificName(formatted);
    }
  }

  window.QuizEngine = new QuizEngine();
})();
