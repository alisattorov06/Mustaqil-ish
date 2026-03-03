import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  Printer, 
  Loader2, 
  ChevronRight, 
  BookOpen, 
  User, 
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { generatePaper, PaperData } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { saveAs } from 'file-saver';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType
} from 'docx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [fullName, setFullName] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [authorInfo, setAuthorInfo] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [pageCount, setPageCount] = useState(5);
  const [planItems, setPlanItems] = useState<string[]>(['Mavzuning dolzarbligi', 'Asosiy tushunchalar']);
  const [newPlanItem, setNewPlanItem] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  const addPlanItem = () => {
    if (newPlanItem.trim()) {
      setPlanItems([...planItems, newPlanItem.trim()]);
      setNewPlanItem('');
    }
  };

  const removePlanItem = (index: number) => {
    setPlanItems(planItems.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!fullName || !subject || !topic || planItems.length === 0) {
      setError('Iltimos, barcha maydonlarni to\'ldiring va kamida bitta reja bandini kiriting.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    try {
      const data: PaperData = {
        fullName,
        subject,
        topic,
        plans: planItems,
        authorInfo,
        abstract,
        keywords,
        fontSize,
        fontFamily,
        lineSpacing,
        pageCount
      };
      const result = await generatePaper(data);
      if (result) {
        setGeneratedContent(result);
      }
    } catch (err) {
      console.error(err);
      setError('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!generatedContent) return;

    // Remove page break markers for Word export
    const cleanContent = generatedContent.replace(/\[SAHIFA_YAKUNI\]/g, '');
    const lines = cleanContent.split('\n');
    const children = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Heuristic: If line is all caps and short, treat as heading
      const isHeading = trimmedLine.length > 3 && trimmedLine.length < 50 && trimmedLine === trimmedLine.toUpperCase();

      children.push(new Paragraph({
        children: [new TextRun({ 
          text: line, 
          size: fontSize * 2, 
          font: fontFamily,
          bold: isHeading
        })],
        spacing: { line: lineSpacing * 240 },
        alignment: isHeading ? AlignmentType.CENTER : AlignmentType.JUSTIFIED
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${topic.replace(/\s+/g, '_')}_mustaqil_ish.docx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${topic.replace(/\s+/g, '_')}_mustaqil_ish.md`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Input Area */}
      <div className={cn(
        "w-full md:w-1/3 lg:w-1/4 bg-white border-r border-stone-200 p-6 overflow-y-auto no-print",
        generatedContent ? "hidden md:block" : "block"
      )}>
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-emerald-600 p-2 rounded-lg">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-800">Mustaqil Ish AI</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2 mb-2">Hujjat Formati</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-stone-500 mb-1">Shrift Turi</label>
                <select 
                  value={fontFamily} 
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">O'lcham</label>
                <select 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  {[10, 11, 12, 14, 16].map(s => <option key={s} value={s}>{s}pt</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">Interval</label>
                <select 
                  value={lineSpacing} 
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  {[1.0, 1.15, 1.5, 2.0].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-stone-500 mb-1">Sahifalar soni</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={pageCount} 
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-stone-700 w-8">{pageCount}</span>
                </div>
              </div>
            </div>
          </div>

          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-2">
              <User size={14} /> Ism va Familya
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Ali Valiyev"
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </section>

          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-2">
              <GraduationCap size={14} /> Fan nomi
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Masalan: Axborot Texnologiyalari"
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </section>

          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-2">
              <BookOpen size={14} /> Mavzu
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Mustaqil ish mavzusini kiriting..."
              rows={2}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </section>

          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Muallif haqida (Fakultet, guruh)
            </label>
            <input
              type="text"
              value={authorInfo}
              onChange={(e) => setAuthorInfo(e.target.value)}
              placeholder="Masalan: TATU, 3-kurs, 112-guruh"
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </section>

          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Annotatsiya va Kalit so'zlar
            </label>
            <div className="space-y-2">
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Annotatsiya (ixtiyoriy)..."
                rows={2}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-sm"
              />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Kalit so'zlar..."
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
          </section>

          <section>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-2">
              <FileText size={14} /> Reja bandlari
            </label>
            <div className="space-y-2 mb-3">
              <AnimatePresence initial={false}>
                {planItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg group"
                  >
                    <span className="text-sm text-stone-700 truncate pr-2">{index + 1}. {item}</span>
                    <button
                      onClick={() => removePlanItem(index)}
                      className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlanItem}
                onChange={(e) => setNewPlanItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlanItem()}
                placeholder="Yangi band qo'shish..."
                className="flex-1 px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-emerald-500 transition-all"
              />
              <button
                onClick={addPlanItem}
                className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </section>

          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                Yaratilmoqda...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Hujjatni yaratish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-stone-100 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {!generatedContent && !isGenerating ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                <FileText className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-stone-800 mb-4">Tayyorlanishga tayyormisiz?</h2>
              <p className="text-stone-500 max-w-md leading-relaxed">
                Chap tomondagi maydonlarni to'ldiring va biz sizga professional darajadagi mustaqil ishni bir necha soniyada yaratib beramiz.
              </p>
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
                {[
                  { icon: Sparkles, title: "AI Quvvati", desc: "Gemini 3.1 Pro yordamida" },
                  { icon: Printer, title: "Tayyor Format", desc: "Chop etishga tayyor" },
                  { icon: GraduationCap, title: "Akademik", desc: "Oliy ta'lim standartlari" }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                    <item.icon className="w-6 h-6 text-emerald-600 mb-2 mx-auto" />
                    <h3 className="font-bold text-stone-800 text-sm">{item.title}</h3>
                    <p className="text-stone-500 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-12 overflow-hidden"
            >
              <div className="relative w-48 h-48">
                {/* Robot Head */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-32 h-24 bg-stone-800 rounded-2xl border-4 border-emerald-500 relative flex flex-col items-center justify-center overflow-hidden shadow-2xl">
                    {/* Eyes */}
                    <div className="flex gap-6 mb-2">
                      <motion.div 
                        animate={{ scaleY: [1, 0.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
                        className="w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]" 
                      />
                      <motion.div 
                        animate={{ scaleY: [1, 0.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
                        className="w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]" 
                      />
                    </div>
                    {/* Mouth/Data lines */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-1 bg-emerald-500/50 rounded-full"
                        />
                      ))}
                    </div>
                    {/* Scanning Line */}
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-emerald-400/30 shadow-[0_0_5px_#34d399]"
                    />
                  </div>
                  {/* Antennas */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-12 -z-10">
                    <div className="w-1 h-8 bg-stone-700 rounded-full relative">
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full blur-[2px]" 
                      />
                    </div>
                    <div className="w-1 h-8 bg-stone-700 rounded-full relative">
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                        className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full blur-[2px]" 
                      />
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating Particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -100], 
                      x: [0, (i % 2 === 0 ? 50 : -50)],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2, 
                      repeat: Infinity, 
                      delay: i * 0.5 
                    }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-500/20 rounded-full"
                  />
                ))}
              </div>
              
              <h2 className="text-2xl font-serif font-bold text-stone-800 mt-12 mb-2">AI Robot ishlamoqda...</h2>
              <div className="flex items-center gap-2 text-stone-500">
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Ma'lumotlar tahlil qilinmoqda
                </motion.span>
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1 h-1 bg-stone-400 rounded-full" />
                  <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-stone-400 rounded-full" />
                  <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-stone-400 rounded-full" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 md:p-12"
            >
              {/* Action Bar */}
              <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center no-print">
                <button
                  onClick={() => setGeneratedContent(null)}
                  className="text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm font-medium"
                >
                  <ChevronRight className="rotate-180" size={16} /> Ortga qaytish
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadDocx}
                    className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    <FileText size={16} className="text-blue-600" /> Word (.docx)
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                  >
                    <Download size={16} /> Markdown (.md)
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-md shadow-emerald-600/20"
                  >
                    <Printer size={16} /> Chop etish
                  </button>
                </div>
              </div>

              {/* A4 Document Preview */}
              <div className="max-w-[210mm] mx-auto space-y-8 no-print">
                {generatedContent?.split('[SAHIFA_YAKUNI]').map((page, index) => (
                  <div 
                    key={index}
                    style={{ 
                      fontSize: `${fontSize}pt`, 
                      lineHeight: lineSpacing,
                      fontFamily: fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : 'inherit'
                    }}
                    className="bg-white shadow-2xl p-[20mm] md:p-[30mm] print-container min-h-[297mm] whitespace-pre-wrap text-justify relative"
                  >
                    {page.trim()}
                    <div className="absolute bottom-4 right-8 text-[10px] text-stone-400 font-mono no-print">
                      Sahifa {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Print-only View (No page breaks for browser print to handle naturally) */}
              <div 
                style={{ 
                  fontSize: `${fontSize}pt`, 
                  lineHeight: lineSpacing,
                  fontFamily: fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : 'inherit'
                }}
                className="hidden print:block whitespace-pre-wrap text-justify"
              >
                {generatedContent?.replace(/\[SAHIFA_YAKUNI\]/g, '')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
