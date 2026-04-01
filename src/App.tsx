import React, { useState, useCallback } from 'react';
import {
  Globe,
  Download,
  Settings2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  X,
  RefreshCw,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import trendsData from './data/trends.json';
import { scrapeProduct } from './lib/firecrawl';
import { analyzeAndTranslate, generateDetailPage, translateImage } from './lib/gemini';
import { PLATFORMS, CATEGORIES, getAvailableCategories } from './lib/categories';
import type { Platform, Category, AppMode, ProcessStep, ProductData, TrendData } from './types';

const SAMPLE_TRENDS: TrendData = trendsData as TrendData;

// Category tab labels for the header chips
const HEADER_CATEGORIES: { id: Category; label: string }[] = [
  { id: 'beauty', label: '뷰티' },
  { id: 'skincare', label: '스킨케어' },
  { id: 'makeup', label: '메이크업' },
  { id: 'fashion', label: '패션' },
  { id: 'electronics', label: '디지털' },
  { id: 'food_health', label: '식품' },
  { id: 'home_living', label: '생활' },
  { id: 'sports', label: '스포츠' },
];

// Sample DataLab trend data for right panel
const DATALAB_TRENDS = [
  { label: '화장품/미용', value: 100 },
  { label: '패션의류', value: 78 },
  { label: '디지털/가전', value: 65 },
  { label: '식품/건강', value: 54 },
  { label: '생활/인테리어', value: 42 },
  { label: '스포츠/레저', value: 35 },
];

// External site quick-links — 국기 이모지 대신 아이콘 이모지 사용
const EXTERNAL_LINKS: { flag: string; label: string; platform: Platform; url: string; example: string }[] = [
  { flag: '🔥', label: 'Amazon', platform: 'amazon', url: 'https://www.amazon.com/gp/movers-and-shakers/beauty/', example: 'https://www.amazon.com/dp/B00TTD9BRC' },
  { flag: '🛒', label: 'eBay', platform: 'ebay' as Platform, url: 'https://www.ebay.com/b/Beauty/26395/bn_731819', example: 'https://www.ebay.com/itm/296375023927' },
  { flag: '🏭', label: '1688', platform: 'amazon' as Platform, url: 'https://www.1688.com/', example: 'https://detail.1688.com/offer/1260650507.html' },
  { flag: '🌐', label: 'Alibaba', platform: 'amazon' as Platform, url: 'https://www.alibaba.com/', example: 'https://www.alibaba.com/product-detail/Living-Room-Chairs_10000021542119.html' },
  { flag: '🛍️', label: 'Qoo10', platform: 'qoo10', url: 'https://www.qoo10.jp/gmkt.inc/Bestsellers/?g=2', example: 'https://www.qoo10.jp/item/COSRX-advanced-snail/1050199001' },
  { flag: '💄', label: '@cosme', platform: 'cosme', url: 'https://www.cosme.net/ranking/', example: 'https://www.cosme.net/products/10218498/' },
];

export default function App() {
  const [mode, setMode] = useState<AppMode>('trend');
  const [category, setCategory] = useState<Category>('beauty');
  const [geminiKey, setGeminiKey] = useState(
    () => localStorage.getItem('gemini_key') || ''
  );
  const [firecrawlKey, setFirecrawlKey] = useState(
    () => localStorage.getItem('firecrawl_key') || ''
  );
  const [showSettings, setShowSettings] = useState(
    () => !localStorage.getItem('gemini_key') && !localStorage.getItem('firecrawl_key')
  );

  // Product mode state
  const [productUrl, setProductUrl] = useState('');
  const [processStep, setProcessStep] = useState<ProcessStep>('idle');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Image translation state
  const [translatedImages, setTranslatedImages] = useState<Record<number, string>>({});
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);

  const saveGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem('gemini_key', key);
  };

  const saveFirecrawlKey = (key: string) => {
    setFirecrawlKey(key);
    localStorage.setItem('firecrawl_key', key);
  };

  // handleTranslate: no urlOverride — user paste + button click only
  const handleTranslate = useCallback(async () => {
    const url = productUrl.trim();
    if (!url) return;
    if (!firecrawlKey || !geminiKey) {
      setShowSettings(true);
      return;
    }

    setMode('product');
    setProcessStep('scraping');
    setErrorMessage('');
    setProductData(null);
    setGeneratedHtml('');

    try {
      const markdown = await scrapeProduct(url, firecrawlKey);

      setProcessStep('translating');
      const product = await analyzeAndTranslate(markdown, geminiKey);
      product.source_url = url;
      setProductData(product);

      setProcessStep('generating');
      const html = await generateDetailPage(product, geminiKey);
      setGeneratedHtml(html);

      setProcessStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다';
      setErrorMessage(msg);
      setProcessStep('error');
    }
  }, [productUrl, firecrawlKey, geminiKey]);

  const getHtmlWithTranslations = useCallback(() => {
    if (!generatedHtml || !productData) return generatedHtml;
    let html = generatedHtml;
    Object.entries(translatedImages).forEach(([idx, dataUrl]) => {
      const origUrl = productData.images[Number(idx)];
      if (origUrl && dataUrl) {
        const urlKey = origUrl.split('/').pop()?.split('?')[0] || '';
        if (urlKey) {
          html = html.replace(new RegExp(urlKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), dataUrl);
        }
      }
    });
    return html;
  }, [generatedHtml, productData, translatedImages]);

  const handleDownloadHtml = useCallback(() => {
    const html = getHtmlWithTranslations();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productData?.brand || 'product'}_상세페이지.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getHtmlWithTranslations, productData]);

  const handleImageTranslate = useCallback(async (index: number, imageUrl: string) => {
    if (translatingIndex !== null) return;

    // Toggle off
    if (translatedImages[index]) {
      setTranslatedImages(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }

    setTranslatingIndex(index);
    try {
      const translatedDataUrl = await translateImage(imageUrl, geminiKey);
      setTranslatedImages(prev => ({ ...prev, [index]: translatedDataUrl }));
      // Apply to iframe preview
      const iframe = document.querySelector('iframe[title="상세페이지 미리보기"]') as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        const urlKey = imageUrl.split('/').pop()?.split('?')[0] || '';
        iframe.contentDocument.querySelectorAll('img').forEach((img) => {
          if (urlKey && img.src.includes(urlKey)) {
            img.src = translatedDataUrl;
          }
        });
      }
    } catch (err) {
      console.error('Image translation failed:', err);
      alert('이미지 번역에 실패했습니다.');
    } finally {
      setTranslatingIndex(null);
    }
  }, [translatingIndex, translatedImages, geminiKey]);

  const isProcessing = processStep !== 'idle' && processStep !== 'done' && processStep !== 'error';

  // Naver products for sidebar
  const naverProducts = SAMPLE_TRENDS.platforms['naver']?.[category] ?? [];
  // Amazon products for sidebar
  const amazonProducts = SAMPLE_TRENDS.platforms['amazon']?.[category] ?? [];

  // Right panel: top 5 from ebay/qoo10/cosme
  const rightPanelSections: { flag: string; label: string; platform: string; cat: string; limit: number }[] = [
    { flag: '🛒', label: 'eBay', platform: 'ebay', cat: category, limit: 5 },
    { flag: '🛍️', label: 'Qoo10', platform: 'qoo10', cat: category, limit: 5 },
    // @cosme removed from right panel per user request
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Pretendard, ui-sans-serif, system-ui, sans-serif' }}>
      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[440px] shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings2 size={20} className="text-blue-600" />
                API 설정
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-2 block font-medium">
                  Gemini API 키 (텍스트 분석용)
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => saveGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Google AI Studio에서 무료로 발급 (
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    aistudio.google.com
                  </a>
                  )
                </p>
                <p className="text-xs text-green-600 mt-1">
                  이미지 번역은 자동으로 제공됩니다
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-2 block font-medium">
                  Firecrawl API Key
                </label>
                <input
                  type="password"
                  value={firecrawlKey}
                  onChange={(e) => saveFirecrawlKey(e.target.value)}
                  placeholder="fc-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                <p className="text-xs text-slate-400 mt-2">
                  <a
                    href="https://firecrawl.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    firecrawl.dev
                  </a>
                  에서 무료 500크레딧 제공
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* ── Header (56px) ── */}
      <header
        className="bg-white border-b border-slate-200 sticky top-0 z-40"
        style={{ height: '56px' }}
      >
        <div className="h-full px-4 flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 hidden md:block whitespace-nowrap">
              글로벌 제품 탐색기
            </span>
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 flex-nowrap px-1">
            {HEADER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  category === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="ml-auto" />

          {/* Settings icon */}
          <button
            onClick={() => setShowSettings(true)}
            className="relative shrink-0 p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Settings2 size={18} />
            {(!geminiKey || !firecrawlKey) && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* ── Left Sidebar (fixed) ── */}
      <aside
        className="fixed left-0 bg-white border-r border-slate-200 hide-scrollbar z-30"
        style={{ width: '260px', top: '56px', height: 'calc(100vh - 56px)' }}
      >
          {/* Naver popular */}
          <div className="p-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              📦 네이버 인기
            </p>
            {naverProducts.length === 0 ? (
              <p className="text-xs text-slate-400 px-1 py-2">데이터 준비 중</p>
            ) : (
              naverProducts.map((product) => (
                <a
                  key={product.rank}
                  href={product.product_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-2 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors mb-0.5"
                  title={product.title}
                >
                  <span className="text-xs font-bold text-blue-500 w-5 shrink-0">{product.rank}</span>
                  <img
                    src={product.image_url || ''}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = 'none';
                      const placeholder = el.nextElementSibling;
                      if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                    }}
                    alt=""
                  />
                  <div className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center shrink-0" style={{ display: 'none' }}>
                    <span className="text-slate-300 text-xs">📷</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-slate-700 truncate">{product.title}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {product.price && product.price !== '-' && product.price !== 'N/A' && (
                        <span className="text-slate-500 font-medium">{product.price}</span>
                      )}
                      {product.change && product.change !== '-' && product.change !== 'N/A' && (
                        <span className="text-green-600 font-semibold">{product.change}</span>
                      )}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 mx-3" />

          {/* Amazon rising */}
          <div className="p-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              🔥 Amazon 급상승
            </p>
            {amazonProducts.length === 0 ? (
              <p className="text-xs text-slate-400 px-1 py-2">데이터 준비 중</p>
            ) : (
              amazonProducts.map((product) => (
                <a
                  key={product.rank}
                  href={product.product_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-2 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors mb-0.5"
                  title={product.title}
                >
                  <span className="text-xs font-bold text-blue-500 w-5 shrink-0">{product.rank}</span>
                  <img
                    src={product.image_url || ''}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = 'none';
                      const placeholder = el.nextElementSibling;
                      if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                    }}
                    alt=""
                  />
                  <div className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center shrink-0" style={{ display: 'none' }}>
                    <span className="text-slate-300 text-xs">📷</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-slate-700 truncate">{product.title}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {product.price && product.price !== '-' && product.price !== 'N/A' && (
                        <span className="text-slate-500 font-medium">{product.price}</span>
                      )}
                      {product.rating && product.rating !== '-' && product.rating !== 'N/A' && (
                        <span className="text-yellow-500">★{product.rating}</span>
                      )}
                      {product.change && product.change !== '-' && product.change !== 'N/A' && (
                        <span className="text-green-600 font-semibold">{product.change}</span>
                      )}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          <div className="flex-1" />
        </aside>

      {/* ── Main content (page scroll) ── */}
      <main className="bg-slate-50" style={{ marginLeft: '260px', marginRight: '280px', minHeight: 'calc(100vh - 56px)', overflow: 'visible' }}>
          {/* URL input bar — always visible at top of main panel */}
          <div className="p-4 border-b border-slate-200 bg-white shrink-0">
            <div className="flex gap-3">
              <input
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                placeholder="해외 제품 URL을 붙여넣으세요 (Amazon, eBay, 1688, Qoo10, @cosme)"
                disabled={isProcessing}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
              <button
                onClick={handleTranslate}
                disabled={!productUrl.trim() || isProcessing}
                className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1.5 whitespace-nowrap ${
                  !productUrl.trim() || isProcessing
                    ? 'bg-blue-100 text-blue-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : '번역하기'}
              </button>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1">
            {/* State 1: idle (no URL entered yet, not in product mode) */}
            {mode === 'trend' && (
              <div className="p-8 max-w-3xl mx-auto">
                {/* 메인 안내 */}
                <div className="text-center mb-10">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe size={28} className="text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">해외 제품을 한국어 상세페이지로</h2>
                  <p className="text-sm text-slate-500">해외 제품 URL을 붙여넣으면 번역 + 상세페이지를 자동 생성합니다</p>
                </div>

                {/* 사용 방법 3단계 */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                  <div className="bg-white rounded-xl p-5 border border-slate-100 text-center">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-blue-500">1</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">제품 찾기</p>
                    <p className="text-xs text-slate-400">좌측 랭킹에서 발견하거나<br/>해외 사이트에서 직접 검색</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 text-center">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-blue-500">2</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">URL 붙여넣기</p>
                    <p className="text-xs text-slate-400">상단 입력창에<br/>제품 페이지 URL을 붙여넣기</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 text-center">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-blue-500">3</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">상세페이지 생성</p>
                    <p className="text-xs text-slate-400">AI가 번역하고<br/>한국어 상세페이지를 자동 생성</p>
                  </div>
                </div>

                {/* 지원 사이트 */}
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">지원 사이트</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {EXTERNAL_LINKS.map((site) => (
                      <button
                        key={site.label}
                        onClick={() => setProductUrl(site.example)}
                        className="text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-lg">{site.flag}</span>
                          <span className="text-sm font-bold text-slate-700">{site.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate group-hover:text-blue-500 transition-colors">{site.example}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* State 2/3/4: product mode */}
            {mode === 'product' && (
              <div className="p-6">
                {/* State 2: processing */}
                {isProcessing && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      {[
                        {
                          step: 'scraping',
                          label: '제품 데이터 수집 완료',
                          desc: 'Firecrawl로 페이지 스크래핑 중...',
                        },
                        {
                          step: 'translating',
                          label: 'AI 분석 + 한국어 번역 완료',
                          desc: 'Gemini가 데이터 추출 + 번역 중...',
                        },
                        {
                          step: 'generating',
                          label: '상세페이지 생성 중...',
                          desc: '피그마급 상세페이지 디자인 생성 중...',
                        },
                      ].map(({ step, label, desc }, i) => {
                        const stepOrder = ['scraping', 'translating', 'generating', 'done'];
                        const currentIdx = stepOrder.indexOf(processStep);
                        const isDone = currentIdx > i;
                        const isActive = currentIdx === i;
                        return (
                          <div
                            key={step}
                            className={`flex items-center gap-4 py-3.5 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                              {isDone ? (
                                <CheckCircle2 size={20} className="text-green-500" />
                              ) : isActive ? (
                                <Loader2 size={20} className="text-blue-500 animate-spin" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                              )}
                            </div>
                            <div>
                              <p
                                className={`text-sm font-medium ${
                                  isDone
                                    ? 'text-green-600'
                                    : isActive
                                    ? 'text-slate-900'
                                    : 'text-slate-400'
                                }`}
                              >
                                {isDone ? `✅ ${label}` : isActive ? `⏳ ${label}` : label}
                              </p>
                              {isActive && (
                                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* State 4: error */}
                {processStep === 'error' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                        <button
                          onClick={handleTranslate}
                          className="mt-2.5 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> 다시 시도
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* State 3: done */}
                {processStep === 'done' && generatedHtml && (
                  <div className="flex flex-col gap-4">
                    {/* iframe preview — auto-height, scrolls with center panel */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-full">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                        <span className="text-xs text-slate-500 font-medium">상세페이지 미리보기</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                        </div>
                      </div>
                      <iframe
                        srcDoc={generatedHtml}
                        className="w-full border-0"
                        scrolling="no"
                        style={{ minHeight: '600px', overflow: 'hidden' }}
                        title="상세페이지 미리보기"
                        onLoad={(e) => {
                          const iframe = e.currentTarget;
                          const doc = iframe.contentDocument;
                          if (doc) {
                            const containerWidth = iframe.clientWidth;
                            const zoomRatio = Math.min(containerWidth / 1200, 0.85);
                            doc.documentElement.style.zoom = String(zoomRatio);
                            doc.documentElement.style.overflow = 'hidden';
                            doc.body.style.overflow = 'hidden';
                            // Wait for zoom reflow, then measure twice for accuracy
                            setTimeout(() => {
                              const h = doc.documentElement.scrollHeight;
                              iframe.style.height = h + 'px';
                              setTimeout(() => {
                                iframe.style.height = doc.documentElement.scrollHeight + 'px';
                              }, 100);
                            }, 200);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </main>

      {/* ── Right Panel (fixed) ── */}
      <aside
        className="fixed right-0 bg-white border-l border-slate-200 hide-scrollbar z-30"
        style={{ width: '280px', top: '56px', height: 'calc(100vh - 56px)' }}
      >
          {/* URL 입력 후 완료 상태: 제품 요약 */}
          {processStep === 'done' && productData ? (
            <div className="p-4 space-y-4">
              {/* Product summary */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">제품 요약</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">브랜드</span>
                    <span className="text-slate-900 font-medium text-right">{productData.brand}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">가격</span>
                    <span className="text-slate-900 font-medium text-right">
                      {productData.price}
                      {productData.price_krw && (
                        <span className="text-slate-400 ml-1">
                          (₩{productData.price_krw.toLocaleString()})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">별점</span>
                    <span className="text-amber-500 font-medium">{productData.rating}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">리뷰</span>
                    <span className="text-slate-900">{productData.review_count}개</span>
                  </div>
                </div>
              </div>

              {/* Image gallery */}
              {productData.images && productData.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-slate-400" />
                    이미지 ({productData.images.length}개)
                  </h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {productData.images.slice(0, 9).map((img, i) => (
                      <div
                        key={i}
                        className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
                      >
                        <img
                          src={translatedImages[i] || img}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {/* Translate button */}
                        <button
                          onClick={() => handleImageTranslate(i, img)}
                          disabled={translatingIndex !== null}
                          className={`absolute bottom-0 right-0 m-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                            translatingIndex === i
                              ? 'bg-blue-600 text-white opacity-100'
                              : translatedImages[i]
                                ? 'bg-green-600 text-white opacity-80 hover:opacity-100'
                                : 'bg-black/60 text-white opacity-70 hover:opacity-100'
                          }`}
                        >
                          {translatingIndex === i ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : translatedImages[i] ? (
                            '원문'
                          ) : (
                            '번역'
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleDownloadHtml}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  <Download size={14} />
                  HTML 다운로드
                </button>
                <button
                  onClick={() => {
                    if (productData) {
                      const data = {
                        ...productData,
                        translated_images: Object.entries(translatedImages).reduce((acc, [idx, url]) => {
                          acc[productData.images[Number(idx)]] = url;
                          return acc;
                        }, {} as Record<string, string>),
                      };
                      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors"
                >
                  <FileText size={14} />
                  데이터 복사
                </button>
              </div>
            </div>
          ) : (
            /* URL 입력 전: 해외 바로가기 + eBay/Qoo10 TOP */
            <div className="p-4 space-y-4">
              {/* 해외 바로가기 */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">🔗 해외 사이트 바로가기</h3>
                <div className="space-y-0.5">
                  {EXTERNAL_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 rounded-lg text-[13px] text-slate-700 hover:text-blue-600 transition-colors"
                    >
                      <span>{link.flag}</span>
                      <span className="font-medium">{link.label}</span>
                      <ArrowUpRight size={12} className="ml-auto text-slate-300" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* eBay / Qoo10 TOP */}
              {rightPanelSections.map((section) => {
                const products =
                  (SAMPLE_TRENDS.platforms[section.platform]?.[section.cat] ?? []).slice(0, section.limit);
                return (
                  <div key={section.label}>
                    <div className="flex items-center gap-2 px-1 py-2 mb-1">
                      <span className="text-base">{section.flag}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{section.label} TOP {section.limit}</span>
                    </div>
                    {products.length === 0 ? (
                      <p className="text-xs text-slate-400 px-1">데이터 준비 중</p>
                    ) : (
                      <div className="space-y-0.5">
                        {products.map((product) => (
                          <a
                            key={product.rank}
                            href={product.product_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start gap-2.5 py-2 px-1 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title={product.title}
                          >
                            <span className="text-xs font-bold text-blue-500 w-5 shrink-0 pt-0.5">{product.rank}</span>
                            <img
                              src={product.image_url || ''}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                              onError={(e) => {
                                const el = e.currentTarget as HTMLImageElement;
                                el.style.display = 'none';
                                const placeholder = el.nextElementSibling;
                                if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                              }}
                              alt=""
                            />
                            <div className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center shrink-0" style={{ display: 'none' }}>
                              <span className="text-slate-300 text-xs">📷</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-[13px] text-slate-700 font-medium"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                } as React.CSSProperties}
                              >
                                {product.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                                {product.price && product.price !== '-' && product.price !== 'N/A' && (
                                  <span className="text-slate-500 font-medium">{product.price}</span>
                                )}
                                {product.rating && product.rating !== '-' && product.rating !== 'N/A' && (
                                  <span className="text-yellow-500">★{product.rating}</span>
                                )}
                                {product.review_count && product.review_count !== '-' && product.review_count !== 'N/A' && (
                                  <span className="text-slate-400">{product.review_count}</span>
                                )}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-slate-100 mt-2" />
                  </div>
                );
              })}
            </div>
          )}
      </aside>
    </div>
  );
}
