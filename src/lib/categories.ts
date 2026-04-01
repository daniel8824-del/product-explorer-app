import type { Platform, Category, CategoryInfo } from '../types';

export const PLATFORMS: { id: Platform; label: string; flag: string }[] = [
  { id: 'naver', label: '네이버', flag: '🇰🇷' },
  { id: 'amazon', label: 'Amazon', flag: '🇺🇸' },
  { id: 'temu', label: 'Temu', flag: '🇨🇳' },
  { id: 'qoo10', label: 'Qoo10', flag: '🇯🇵' },
  { id: 'cosme', label: '@cosme', flag: '🇯🇵' },
  { id: 'ebay', label: 'eBay', flag: '🇺🇸' },
];

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'beauty',
    label: '뷰티/화장품',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000850' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/beauty/' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=beauty+best+seller' },
      qoo10: { url: 'https://www.qoo10.jp/gmkt.inc/Bestsellers/?g=2' },
      cosme: { url: 'https://www.cosme.net/ranking/' },
      ebay: { url: 'https://www.ebay.com/b/Skin-Care/11863/bn_1865546' },
    },
  },
  {
    id: 'skincare',
    label: '스킨케어',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000851' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/beauty/11062741' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=skincare' },
      qoo10: { url: 'https://www.qoo10.jp/s/skincare' },
      cosme: { url: 'https://www.cosme.net/ranking/category/800/' },
      ebay: { url: 'https://www.ebay.com/b/Skin-Care/11863/bn_1865546' },
    },
  },
  {
    id: 'makeup',
    label: '메이크업',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000852' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/beauty/11058281' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=makeup' },
      qoo10: { url: 'https://www.qoo10.jp/s/makeup' },
      cosme: { url: 'https://www.cosme.net/ranking/category/802/' },
      ebay: { url: 'https://www.ebay.com/b/Makeup/31387/bn_1865549' },
    },
  },
  {
    id: 'fashion',
    label: '패션/의류',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000001' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/fashion/' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=fashion' },
      qoo10: { url: 'https://www.qoo10.jp/gmkt.inc/Bestsellers/?g=1' },
      cosme: null,
      ebay: { url: 'https://www.ebay.com/b/Fashion/26395/bn_7000259856' },
    },
  },
  {
    id: 'electronics',
    label: '전자/디지털',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000003' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/electronics/' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=electronics' },
      qoo10: { url: 'https://www.qoo10.jp/gmkt.inc/Bestsellers/?g=4' },
      cosme: null,
      ebay: { url: 'https://www.ebay.com/b/Electronics/bn_7000259124' },
    },
  },
  {
    id: 'food_health',
    label: '식품/건강',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000006' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/grocery/' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=health+food' },
      qoo10: { url: 'https://www.qoo10.jp/gmkt.inc/Bestsellers/?g=6' },
      cosme: { url: 'https://www.cosme.net/ranking/category/806/' },
      ebay: { url: 'https://www.ebay.com/b/Health-Beauty/26395/bn_7000259856' },
    },
  },
  {
    id: 'home_living',
    label: '생활/인테리어',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000004' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/home-garden/' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=home+living' },
      qoo10: { url: 'https://www.qoo10.jp/gmkt.inc/Bestsellers/?g=5' },
      cosme: null,
      ebay: { url: 'https://www.ebay.com/b/Home-Garden/11700/bn_1853126' },
    },
  },
  {
    id: 'sports',
    label: '스포츠/레저',
    platforms: {
      naver: { url: 'https://search.shopping.naver.com/best/category/category?catId=50000007' },
      amazon: { url: 'https://www.amazon.com/gp/movers-and-shakers/sporting-goods/' },
      temu: { url: 'https://www.temu.com/search_result.html?search_key=sports' },
      qoo10: { url: 'https://www.qoo10.jp/gmkt.inc/Bestsellers/?g=3' },
      cosme: null,
      ebay: { url: 'https://www.ebay.com/b/Sporting-Goods/888/bn_1865031' },
    },
  },
];

export function getAvailableCategories(platform: Platform): CategoryInfo[] {
  return CATEGORIES.filter(cat => cat.platforms[platform] !== null);
}
