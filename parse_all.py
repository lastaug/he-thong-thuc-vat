# -*- coding: utf-8 -*-
"""
Parser for Botany Quiz and Theory documents.
Reads all 11 docx files from .user_uploaded, parses questions, theory, sections,
and exports JSON and botany_data.js.
"""
import zipfile
import xml.etree.ElementTree as ET
import os
import re
import json

folder = r'C:/Users/ASUS/.gemini/antigravity/brain/ff47acbf-e72c-4657-9bf1-d8283b1d72e9/.user_uploaded'

files_config = [
    ('media_1795451137012_2272555c.docx', 1, 'CHƯƠNG 1. PHÂN LOẠI VÀ DANH PHÁP KHOA HỌC', 'Chương 1'),
    ('media_1795451137012_8c863355.docx', 2, 'CHƯƠNG 2. RỄ, CỘNG SINH VÀ CÁC LOẠI "CỦ"', 'Chương 2'),
    ('media_1795451137011_c6b2079e.docx', 3, 'CHƯƠNG 3. MÔ, THÂN VÀ LÁ', 'Chương 3'),
    ('media_1795451137009_3f24af44.docx', 4, 'CHƯƠNG 4. HOA, HOA ĐỒ VÀ HOA THỨC', 'Chương 4'),
    ('media_1795451137010_68410088.docx', 5, 'CHƯƠNG 5. QUẢ VÀ HẠT', 'Chương 5'),
    ('media_1795451137009_c9577288.docx', 6, 'CHƯƠNG 6. DI TRUYỀN, BÀO QUAN VÀ ĐA DẠNG SINH HỌC', 'Chương 6'),
    ('media_1795451137009_1170fc5c.docx', 7, 'CHƯƠNG 7. SINH HỌC PHÂN TỬ TRONG HỆ THỐNG HỌC', 'Chương 7'),
    ('media_1795451137007_7735812d.docx', 8.1, 'CHƯƠNG 8 (PHẦN 1). HỌ THỰC VẬT VÀ QUAN HỆ HỌ HÀNG', 'Chương 8.1'),
    ('media_1795451137007_2b2a7c2e.docx', 8.2, 'CHƯƠNG 8 (PHẦN 2). HỌ THỰC VẬT VÀ QUAN HỆ HỌ HÀNG', 'Chương 8.2'),
    ('media_1795451137007_7bcf3b1c.docx', 9, 'CHƯƠNG 9. TÊN KHOA HỌC CÁC LOÀI CỤ THỂ', 'Chương 9'),
    ('media_1795451137007_6eb29050.docx', 10, 'CHƯƠNG 10. GHÉP CÂY, THU HOẠCH VÀ ỨNG DỤNG', 'Chương 10')
]

def get_docx_paragraphs(docx_path):
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        texts = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            p_text = ''.join(node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
            if p_text.strip():
                texts.append(p_text.strip())
        return texts

all_chapters = []
all_sections = []
all_questions = []

global_q_index = 0

for fname, ch_id, ch_title, ch_short in files_config:
    fpath = os.path.join(folder, fname)
    paras = get_docx_paragraphs(fpath)
    
    current_sec = None
    intro_text = ''
    
    i = 0
    while i < len(paras):
        p = paras[i]
        
        # Check intro
        if p.startswith('Đợt ') and not intro_text:
            intro_text = p
            i += 1
            continue
            
        # Check section header like '1.1 Các bậc phân loại...'
        m_sec = re.match(r'^(\d+\.\d+)\s+(.+)$', p)
        if m_sec and not p.startswith('|'):
            sec_id = m_sec.group(1)
            sec_title = m_sec.group(2)
            theory_text = ''
            if i + 1 < len(paras) and paras[i+1].startswith('Kiến thức nền:'):
                theory_text = paras[i+1].replace('Kiến thức nền:', '').strip()
                i += 1
                
                # Check if this section already exists in all_sections
                existing = [s for s in all_sections if s['chapter_id'] == ch_id and s['id'] == sec_id]
                if existing:
                    current_sec = existing[0]
                    if not current_sec['theory']:
                        current_sec['theory'] = theory_text
                else:
                    current_sec = {
                        'id': sec_id,
                        'chapter_id': ch_id,
                        'chapter_title': ch_title,
                        'title': f'{sec_id} {sec_title}',
                        'theory': theory_text,
                        'question_ids': []
                    }
                    all_sections.append(current_sec)
                i += 1
                continue
            else:
                # If this was just the table row or header without theory, check if it's before the questions
                # Don't add empty duplicate section
                i += 1
                continue
            
        # Check question
        if re.match(r'^Câu\s+\d+', p):
            global_q_index += 1
            q_header = p
            
            # parse question number and text
            m_q = re.match(r'^Câu\s+(\d+)\.?(.*)$', p)
            if m_q:
                q_num_raw = m_q.group(1)
                q_text = m_q.group(2).strip()
            else:
                q_num_raw = str(global_q_index)
                q_text = p
                
            # gather following lines
            q_paras = []
            j = i + 1
            while j < len(paras):
                pj = paras[j]
                if re.match(r'^Câu\s+\d+', pj) or (re.match(r'^\d+\.\d+\s+', pj) and not pj.startswith('|')) or pj.startswith('CHƯƠNG'):
                    break
                q_paras.append(pj)
                j += 1
                
            ans_str = ''
            gen_expl = ''
            note = ''
            raw_options = []
            
            for qp in q_paras:
                if qp.startswith('Đáp án:'):
                    ans_str = qp.replace('Đáp án:', '').strip()
                elif qp.startswith('Giải thích chung:'):
                    gen_expl = qp.replace('Giải thích chung:', '').strip()
                elif qp.startswith('Lưu ý:'):
                    note = qp.replace('Lưu ý:', '').strip()
                elif re.match(r'^[a-d]\.\s+', qp):
                    raw_options.append(qp)
                    
            m_ans_letter = re.match(r'^([a-d])\.', ans_str, re.IGNORECASE)
            correct_key = m_ans_letter.group(1).lower() if m_ans_letter else ''
            
            options = []
            for ro in raw_options:
                m_opt = re.match(r'^([a-d])\.\s+(.+?)\s*[\u2013\u2014\-]{1,2}\s*(.+)$', ro)
                if m_opt:
                    opt_key = m_opt.group(1).lower()
                    opt_text = m_opt.group(2).strip()
                    opt_expl = m_opt.group(3).strip()
                    is_corr = (opt_key == correct_key) or ('ĐÚNG' in opt_expl.upper())
                    options.append({
                        'key': opt_key,
                        'text': opt_text,
                        'explanation': opt_expl,
                        'is_correct': is_corr
                    })
                else:
                    print(f'Warning: could not parse option: {ro}')
                    
            q_id = f'q_{global_q_index}_{q_num_raw}'
            if current_sec:
                current_sec['question_ids'].append(q_id)
                sec_ref_id = current_sec['id']
                sec_ref_title = current_sec['title']
            else:
                sec_ref_id = ''
                sec_ref_title = ''
                
            # Clean question prompt: if starts with e.g. "Nếu ngọn ghép là..."
            # Keep prompt clean and readable
            prompt_clean = q_text if q_text else q_header
            # Remove any trailing colon or spaces if awkward
            
            # Identify answer status: official from document, note discrepancy, verified
            ans_source = "official_document"
            ans_status_label = "Đáp án từ tài liệu"
            if note:
                ans_source = "verified_with_notes"
                ans_status_label = "Đáp án có lưu ý đối chiếu"
                
            q_obj = {
                'id': q_id,
                'index': global_q_index,
                'original_num': f'Câu {q_num_raw}',
                'num': int(q_num_raw) if q_num_raw.isdigit() else global_q_index,
                'chapter_id': ch_id,
                'chapter_title': ch_title,
                'chapter_short': ch_short,
                'section_id': sec_ref_id,
                'section_title': sec_ref_title,
                'question': prompt_clean,
                'full_header': q_header,
                'correct_key': correct_key,
                'answer_text': ans_str,
                'general_explanation': gen_expl,
                'note': note,
                'has_note': bool(note),
                'ans_source': ans_source,
                'ans_status_label': ans_status_label,
                'options': options,
                'source_file': fname
            }
            all_questions.append(q_obj)
            i = j - 1
            
        i += 1
        
    all_chapters.append({
        'id': ch_id,
        'title': ch_title,
        'short_title': ch_short,
        'intro': intro_text,
        'file_name': fname,
        'question_count': len([q for q in all_questions if q['chapter_id'] == ch_id]),
        'sections': [s for s in all_sections if s['chapter_id'] == ch_id]
    })

print(f'Chapters processed: {len(all_chapters)}')
print(f'Sections processed: {len(all_sections)}')
print(f'Questions processed: {len(all_questions)}')

out_dir = r'd:\Antigravity\DỰ ÁN\Hệ thống thực vật\data'
os.makedirs(out_dir, exist_ok=True)

with open(os.path.join(out_dir, 'chapters.json'), 'w', encoding='utf-8') as f:
    json.dump(all_chapters, f, ensure_ascii=False, indent=2)

with open(os.path.join(out_dir, 'sections.json'), 'w', encoding='utf-8') as f:
    json.dump(all_sections, f, ensure_ascii=False, indent=2)

with open(os.path.join(out_dir, 'questions.json'), 'w', encoding='utf-8') as f:
    json.dump(all_questions, f, ensure_ascii=False, indent=2)

with open(os.path.join(out_dir, 'botany_data.js'), 'w', encoding='utf-8') as f:
    f.write('// TẬP DỮ LIỆU ÔN TẬP HỆ THỐNG THỰC VẬT 2025 - ĐẠI HỌC NÔNG LÂM TP.HCM\n')
    f.write('// Trích xuất tự động từ 11 tài liệu đề cương và giáo trình\n')
    f.write('window.BOTANY_DATA = {\n')
    f.write('  metadata: {\n')
    f.write('    subject: "Hệ thống thực vật",\n')
    f.write('    institution: "Trường Đại học Nông Lâm TP. Hồ Chí Minh",\n')
    f.write('    year: "2025",\n')
    f.write('    totalQuestions: ' + str(len(all_questions)) + ',\n')
    f.write('    totalChapters: ' + str(len(all_chapters)) + ',\n')
    f.write('    totalSections: ' + str(len(all_sections)) + ',\n')
    f.write('    notesCount: ' + str(len([q for q in all_questions if q["has_note"]])) + '\n')
    f.write('  },\n')
    f.write('  chapters: ' + json.dumps(all_chapters, ensure_ascii=False) + ',\n')
    f.write('  sections: ' + json.dumps(all_sections, ensure_ascii=False) + ',\n')
    f.write('  questions: ' + json.dumps(all_questions, ensure_ascii=False) + '\n')
    f.write('};\n')

print('Export complete!')
