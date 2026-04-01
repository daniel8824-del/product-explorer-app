# Global Product Explorer (글로벌 제품 탐색기)

해외 이커머스 제품 URL을 입력하면 AI가 자동으로 스크래핑, 분석, 번역하여 한국어 상세페이지를 생성하는 웹 애플리케이션입니다.

## 주요 기능

- **제품 스크래핑** - Firecrawl API로 해외 제품 페이지 데이터 수집
- **AI 분석/번역** - Gemini 2.5 Flash로 제품 정보 추출 및 한국어 번역
- **상세페이지 생성** - 11섹션 감정흐름 기반 프리미엄 한국어 상세페이지 HTML 자동 생성
- **이미지 번역** - Gemini 3 Pro Image로 제품 이미지 내 외국어 텍스트를 한국어로 교체
- **고해상도 이미지** - Amazon, eBay, Qoo10, 1688, Alibaba, AliExpress, Temu 원본 이미지 자동 변환
- **HTML 다운로드** - 생성된 상세페이지를 HTML 파일로 다운로드
- **데이터 복사** - 분석된 제품 데이터를 JSON으로 복사

## 지원 플랫폼

| 플랫폼 | 예시 URL |
|--------|---------|
| Amazon | `https://www.amazon.com/dp/B00TTD9BRC` |
| eBay | `https://www.ebay.com/itm/296375023927` |
| 1688 | `https://detail.1688.com/offer/1260650507.html` |
| Alibaba | `https://www.alibaba.com/product-detail/...` |
| Qoo10 | `https://www.qoo10.jp/item/...` |
| @cosme | `https://www.cosme.net/products/...` |
| Temu | `https://www.temu.com/...` |
| AliExpress | `https://www.aliexpress.com/item/...` |

## 기술 스택

- **Frontend** - React 19, TypeScript, Tailwind CSS v4
- **Build** - Vite 6
- **AI** - Google Gemini API (@google/genai SDK)
- **Scraping** - Firecrawl API
- **Icons** - Lucide React
- **Deployment** - Vercel

## 시작하기

### 사전 준비

1. **Gemini API 키** (무료) - [aistudio.google.com](https://aistudio.google.com)에서 발급
2. **Firecrawl API 키** (무료 500크레딧) - [firecrawl.dev](https://firecrawl.dev)에서 발급

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/daniel8824/product-explorer-app.git
cd product-explorer-app

# 의존성 설치
npm install

# 환경변수 설정 (이미지 번역용 유료 Gemini 키)
cp .env.example .env
# .env 파일에 VITE_GEMINI_IMAGE_KEY 값 입력

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 Gemini/Firecrawl API 키를 입력하면 사용할 수 있습니다.

### 빌드

```bash
npm run build
```

`dist/` 폴더에 정적 파일이 생성됩니다.

## 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `VITE_GEMINI_IMAGE_KEY` | 이미지 번역용 Gemini API 키 (유료 결제 필요) | 선택 |

> 텍스트 분석용 Gemini 키와 Firecrawl 키는 사용자가 앱 UI에서 직접 입력합니다.

## 프로젝트 구조

```
product-explorer-app/
├── src/
│   ├── App.tsx              # 메인 UI (3패널 레이아웃)
│   ├── main.tsx             # 엔트리포인트
│   ├── index.css            # 글로벌 스타일
│   ├── types.ts             # TypeScript 타입 정의
│   ├── lib/
│   │   ├── gemini.ts        # Gemini API (분석/번역/이미지번역)
│   │   ├── firecrawl.ts     # Firecrawl API (스크래핑)
│   │   └── categories.ts   # 플랫폼별 카테고리 URL 매핑
│   └── data/
│       └── trends.json      # 트렌드 샘플 데이터
├── .env.example             # 환경변수 템플릿
├── vite.config.ts           # Vite 설정
├── tsconfig.json            # TypeScript 설정
└── package.json
```

## 사용 방법

1. 앱 접속 후 설정(톱니바퀴) 아이콘 클릭
2. Gemini API 키, Firecrawl API 키 입력 후 저장
3. 상단 입력창에 해외 제품 URL 붙여넣기
4. "번역 시작" 클릭
5. 자동으로 스크래핑 → 분석/번역 → 상세페이지 생성
6. 우측 패널에서 이미지 갤러리 확인 및 개별 이미지 번역
7. HTML 다운로드 또는 데이터 복사

## 라이선스

MIT
