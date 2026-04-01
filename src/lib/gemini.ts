import { GoogleGenAI } from '@google/genai';
import type { ProductData } from '../types';

const IMAGE_API_KEY = import.meta.env.VITE_GEMINI_IMAGE_KEY || '';

function getAI(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export async function analyzeAndTranslate(markdown: string, apiKey: string): Promise<ProductData> {
  const ai = getAI(apiKey);

  const prompt = `아래는 해외 이커머스 제품 페이지의 전체 마크다운입니다. 여기서 모든 정보를 추출하고 한국어로 번역해주세요.

추출 + 번역 항목:
- product_title: 한국어 제품명
- brand: 브랜드 (원문 유지)
- price: 원본 가격
- price_krw: 원화 환산 (1달러=1,370원, 숫자만)
- rating: 별점
- review_count: 리뷰 수
- description: 한국어 제품 설명 (카피라이팅 톤)
- product_subtitle: 핵심 소구점 1줄
- features: 한국어 특징 목록
- about_this_item: 한국어 About 항목들
- product_specs: 스펙 (key-value, 한국어)
- ingredients: 한국어 성분
- from_the_brand: 브랜드 스토리 (한국어)
- images: 모든 이미지 URL (원본 그대로, 중복 제거)
- reviews: 리뷰 최대 10개 (title, rating, text를 한국어로)
- selling_points: 셀링포인트 7개 (각 15자 이내)
- source_url: 원본 URL

이미지 URL 규칙 (원본 고화질 필수!):
- Amazon: _SS40_, _SS60_, _SS180_, _SY355_ → _SL1500_ 으로 교체
- eBay: s-l140, s-l225 등 → s-l1600 으로 교체
- Qoo10: g_120-w-st_g 등 → g_900-w-st_g 으로 교체
- 1688/Alibaba/AliExpress (alicdn.com): _60x60.jpg, _100x100.jpg 등 크기 접미사 제거하여 원본 URL 사용
- @cosme: 원본 URL 그대로 사용
- 이미 고해상도인 URL은 그대로

반드시 유효한 JSON만 출력하세요.

마크다운:
` + markdown.slice(0, 150000);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.2, responseMimeType: 'application/json' }
  });

  let text = response.text || '';

  text = text.trim();

  // Robust JSON fix: escape all control characters inside string values
  function fixJsonString(raw: string): string {
    let result = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (escaped) {
        result += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\' && inString) {
        // Check next char for valid JSON escape
        const next = raw[i + 1];
        const validEscapes = '"\\\/bfnrtu';
        if (next && !validEscapes.includes(next)) {
          // Invalid escape like \' or \x — skip the backslash
          continue;
        }
        escaped = true;
        result += ch;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        result += ch;
        continue;
      }
      if (inString && ch.charCodeAt(0) < 32) {
        // Escape control characters inside strings
        if (ch === '\n') result += '\\n';
        else if (ch === '\r') result += '\\r';
        else if (ch === '\t') result += '\\t';
        else result += '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
        continue;
      }
      result += ch;
    }
    return result;
  }

  return JSON.parse(fixJsonString(text)) as ProductData;
}

export async function generateDetailPage(product: ProductData, apiKey: string): Promise<string> {
  const ai = getAI(apiKey);

  const prompt = `당신은 한국 이커머스 상세페이지 전문 디자이너입니다.

아래 제품 데이터로 프리미엄 한국 상세페이지 HTML을 만들어주세요.

## 절대 규칙
1. JavaScript 금지 — template literal, document 조작 일체 사용 금지
2. 모든 텍스트를 HTML에 직접 하드코딩
3. 순수 정적 HTML + CSS만
4. Pretendard 폰트: https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css
5. 폭 1200px 고정, margin: 0 auto
6. word-break: keep-all 전역 적용

## 이미지 규칙 (매우 중요!)
1. HERO 섹션의 메인 이미지는 반드시 제품 본체 사진을 사용 (로고, 아이콘, 배너 금지)
2. images 배열에서 제품 사진처럼 보이는 URL을 HERO에 사용 (보통 첫 번째 또는 두 번째)
3. 모든 img 태그에 referrerPolicy="no-referrer" 추가 (핫링크 차단 우회)
4. 이미지 URL 고해상도 치환:
   - Amazon: _SS40_, _SS60_, _SS100_, _SS180_, _SY355_ → _SL1500_ 으로 교체
   - 이미 _SL1500_ 이면 그대로
   - 다른 사이트는 URL 그대로 사용
5. 이미지 크기: HERO max-height:500px, 갤러리 min-height:200px
6. 이미지 onerror 처리: onerror="this.style.display='none'"
7. 갤러리 이미지에 번역 버튼 불필요 — 번역 버튼 넣지 마세요

## 디자인
- CSS 변수(:root)로 일관된 색상 시스템
- 그라데이션, border-radius:16-24px, box-shadow
- 섹션별 배경색 교차
- 제목 32-44px/800, 본문 16px/400

## 11섹션 감정흐름
1. HERO — 그라데이션 + 제품이미지 + 제품명 + 가격 + 별점 + 셀링포인트
2. TRUST — 숫자 강조 인포그래픽 (64px bold)
3. PAIN — 공감 (연한 빨간 배경)
4. SOLUTION — 해결 (연한 초록 배경)
5. FEATURES — 특징 카드 3열 그리드
6. GALLERY — 이미지 그리드 + 번역 버튼
7. SPECS — 스펙 테이블
8. INGREDIENTS — 성분 pill 태그
9. BRAND STORY — A+ 콘텐츠
10. REVIEWS — 리뷰 카드 (긍정=초록, 부정=빨간)
11. CTA — 구매 유도

완전한 HTML 파일 출력 (<!DOCTYPE html> ~ </html>).

제품 데이터:
` + JSON.stringify(product, null, 2).slice(0, 60000);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.7, maxOutputTokens: 40000 }
  });

  let text = response.text || '';
  if (text.includes('```html')) {
    text = text.split('```html')[1].split('```')[0];
  } else if (text.includes('<!DOCTYPE')) {
    text = text.slice(text.indexOf('<!DOCTYPE'));
    if (text.includes('```')) {
      text = text.split('```')[0];
    }
  }

  // 썸네일 URL 후처리 (Amazon)
  text = text.replace(/\._SS\d+_\./g, '._SL1500_.');
  text = text.replace(/\._SY\d+_\./g, '._SL1500_.');
  text = text.replace(/\._SR\d+,\d+_\./g, '._SL1500_.');
  text = text.replace(/\._AC_US\d+_\./g, '._AC_SL1500_.');

  // eBay 썸네일 → 고해상도
  text = text.replace(/s-l\d+\.(webp|jpg|png)/g, 's-l1600.$1');

  // Qoo10 썸네일 → 고해상도
  text = text.replace(/g_\d+-w-st_g\./g, 'g_900-w-st_g.');

  // 1688/Alibaba/AliExpress (alicdn.com) 썸네일 → 원본
  text = text.replace(/\.(jpg|jpeg|png)_\d+x\d+\.\1/gi, '.$1');
  text = text.replace(/_(\d+x\d+)\.(jpg|jpeg|png|webp)/gi, '.$2');

  // Temu 이미지 크기 파라미터 제거
  text = text.replace(/(\.jpeg|\.jpg|\.png|\.webp)\?.*?(?=")/gi, '$1');

  // 모든 img 태그에 referrerPolicy 추가 (없는 경우만)
  text = text.replace(/<img(?![^>]*referrerPolicy)([^>]*?)>/g, '<img referrerPolicy="no-referrer"$1>');

  return text.trim();
}

function imageUrlToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다'));
    img.src = url;
  });
}

export async function translateImage(imageUrl: string, apiKey: string): Promise<string> {
  const effectiveKey = IMAGE_API_KEY || apiKey;
  const ai = getAI(effectiveKey);

  // Get original dimensions
  const origSize = await new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1024, h: 1024 });
    img.src = imageUrl;
  });

  const base64 = await imageUrlToBase64(imageUrl);

  const result = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64 } },
        { text: `이 제품 이미지의 영어/외국어 텍스트를 자연스러운 한국어로 번역해서 원본 디자인 스타일(폰트 크기, 색상, 위치, 배경)을 유지한 채 새 이미지를 생성해줘. 브랜드명은 그대로 유지해. 반드시 원본과 동일한 크기(${origSize.w}x${origSize.h}px)로 생성해.` }
      ]
    }],
    config: { responseModalities: ['IMAGE', 'TEXT'] }
  });

  const parts = result.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error('이미지 생성에 실패했습니다');

  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('번역된 이미지를 받지 못했습니다');
}
