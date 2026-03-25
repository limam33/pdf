import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  Files, 
  Scissors, 
  Type, 
  Zap, 
  Download, 
  ArrowLeft, 
  Loader2, 
  X,
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from './lib/utils';
import { translations, type Language } from './translations';
import { mergePDFs, splitPDF, addTextToPDF, compressPDF } from './lib/pdf-tools';

type ToolType = 'merge' | 'split' | 'addText' | 'compress' | null;

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | Uint8Array[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = t.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, t.rtl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: activeTool === 'merge'
  } as any);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      let processed: Uint8Array | Uint8Array[];
      switch (activeTool) {
        case 'merge':
          processed = await mergePDFs(files);
          break;
        case 'split':
          processed = await splitPDF(files[0]);
          break;
        case 'addText':
          processed = await addTextToPDF(files[0], textInput);
          break;
        case 'compress':
          processed = await compressPDF(files[0]);
          break;
        default:
          throw new Error('Invalid tool');
      }
      setResult(processed);
    } catch (err) {
      console.error(err);
      setError(t.error);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    
    if (Array.isArray(result)) {
      result.forEach((data, index) => {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `split_page_${index + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } else {
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTool}_result.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setResult(null);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12 px-4">
      {[
        { id: 'merge', icon: Files, title: t.merge, desc: t.mergeDesc, color: 'bg-blue-500' },
        { id: 'split', icon: Scissors, title: t.split, desc: t.splitDesc, color: 'bg-purple-500' },
        { id: 'addText', icon: Type, title: t.addText, desc: t.addTextDesc, color: 'bg-orange-500' },
        { id: 'compress', icon: Zap, title: t.compress, desc: t.compressDesc, color: 'bg-green-500' },
      ].map((tool) => (
        <motion.button
          key={tool.id}
          whileHover={{ scale: 1.02, translateY: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveTool(tool.id as ToolType);
            clearFiles();
          }}
          className="flex items-start p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-start"
        >
          <div className={cn("p-4 rounded-xl text-white mr-4 rtl:mr-0 rtl:ml-4", tool.color)}>
            <tool.icon size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{tool.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{tool.desc}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );

  const renderTool = () => (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <button 
        onClick={() => setActiveTool(null)}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-2 rtl:mr-0 rtl:ml-2" />
        {t.back}
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center mb-8">
          <div className={cn(
            "p-3 rounded-2xl text-white mr-4 rtl:mr-0 rtl:ml-4",
            activeTool === 'merge' ? 'bg-blue-500' : 
            activeTool === 'split' ? 'bg-purple-500' : 
            activeTool === 'addText' ? 'bg-orange-500' : 'bg-green-500'
          )}>
            {activeTool === 'merge' && <Files size={24} />}
            {activeTool === 'split' && <Scissors size={24} />}
            {activeTool === 'addText' && <Type size={24} />}
            {activeTool === 'compress' && <Zap size={24} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTool === 'merge' && t.merge}
            {activeTool === 'split' && t.split}
            {activeTool === 'addText' && t.addText}
            {activeTool === 'compress' && t.compress}
          </h2>
        </div>

        {activeTool === 'addText' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.addText}</label>
            <input 
              type="text" 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to add..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        )}

        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50",
            files.length > 0 && "py-6"
          )}
        >
          <input {...getInputProps()} />
          {files.length === 0 ? (
            <div className="flex flex-col items-center">
              <FileUp size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">{t.dropzone}</p>
              <p className="text-gray-400 text-sm mt-1">{t.selectFiles}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center overflow-hidden">
                    <Files size={18} className="text-blue-500 mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={(e) => { e.stopPropagation(); setFiles([]); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline mt-2"
              >
                {t.clear}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 flex items-center p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
            <AlertCircle size={20} className="mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 flex items-center p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
            <CheckCircle2 size={20} className="mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0" />
            <p className="text-sm font-medium">PDF processed successfully!</p>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            disabled={files.length === 0 || processing}
            onClick={handleProcess}
            className={cn(
              "flex-1 flex items-center justify-center py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-blue-100",
              files.length === 0 || processing ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            )}
          >
            {processing ? (
              <>
                <Loader2 size={20} className="mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                {t.loading}
              </>
            ) : (
              t.process
            )}
          </button>

          {result && (
            <button
              onClick={downloadResult}
              className="flex items-center justify-center px-6 py-4 rounded-2xl font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg shadow-green-100 active:scale-95"
            >
              <Download size={20} className="mr-2 rtl:mr-0 rtl:ml-2" />
              {t.download}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTool(null)}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Files size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">{t.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-600">
                <Globe size={18} />
                <span className="hidden sm:inline">
                  {lang === 'en' ? t.english : lang === 'ar' ? t.arabic : t.french}
                </span>
              </button>
              <div className="absolute right-0 rtl:left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
                <button onClick={() => setLang('en')} className="w-full text-start px-4 py-2 hover:bg-gray-50 text-sm font-medium">{t.english}</button>
                <button onClick={() => setLang('ar')} className="w-full text-start px-4 py-2 hover:bg-gray-50 text-sm font-medium">{t.arabic}</button>
                <button onClick={() => setLang('fr')} className="w-full text-start px-4 py-2 hover:bg-gray-50 text-sm font-medium">{t.french}</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4 text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            {t.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto"
          >
            {t.subtitle}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!activeTool ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {renderDashboard()}
            </motion.div>
          ) : (
            <motion.div
              key="tool"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTool()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-12 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-gray-500">
              <Files size={14} />
            </div>
            <span className="font-bold text-gray-400">{t.title}</span>
          </div>
          <p className="text-gray-400 text-sm">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
