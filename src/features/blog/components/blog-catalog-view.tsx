'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '../data/blog-posts';
import { LandingHeader, LandingFooter } from '@/features/landing';

export function BlogCatalogView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchCategory =
        selectedCategory === 'all' || post.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.subtitle.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased font-sans flex flex-col justify-between">
      {/* 1. Header Trang Chủ */}
      <LandingHeader />

      {/* 2. Main Content */}
      <main className="flex-1 pb-16">
        {/* Hero Banner Cẩm nang & Đào tạo */}
        <section className="bg-gradient-to-br from-[#06183a] via-[#091b40] to-[#1e1b4b] text-white py-14 sm:py-18 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/15 backdrop-blur-md">
              <span className="material-symbols-outlined text-[15px]">menu_book</span>
              <span>Cẩm Nang Y Khoa &amp; Tài Liệu Huấn Luyện FamiDoc</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Trung Tâm Hướng Dẫn &amp; Đào Tạo Y Tế Gia Đình
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Khám phá quy chuẩn 4 Trụ cột Y học gia đình, tài liệu đào tạo chuyên môn lâm sàng và cẩm nang tự chăm sóc sức khỏe chủ động chuẩn Bộ Y Tế.
            </p>

            {/* Thanh Tìm Kiếm Nhanh */}
            <div className="max-w-xl mx-auto pt-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm cẩm nang: Telehealth, Bác sĩ gia đình, Dinh dưỡng, EHR..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Danh Mục Phân Loại */}
        <div className="bg-white border-b border-slate-200/80 sticky top-16 z-20 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              {[
                { id: 'all', label: 'Tất cả tài liệu' },
                { id: 'pillar', label: '⭐ 4 Trụ Cột Y Tế' },
                { id: 'clinical', label: 'Lâm sàng & CCHN' },
                { id: 'prevention', label: 'Dự phòng & Dinh dưỡng' },
                { id: 'digital-health', label: 'Y tế số (EHR/Telehealth)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 hidden sm:block shrink-0">
              Hiển thị: <strong>{filteredPosts.length}</strong> bài viết
            </div>
          </div>
        </div>

        {/* Lưới Bài Viết / Cẩm Nang */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-8">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                search_off
              </span>
              <h3 className="text-base font-bold text-slate-700">Không tìm thấy tài liệu phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Vui lòng thử lại với từ khóa khác như &ldquo;Telehealth&rdquo;, &ldquo;Dinh dưỡng&rdquo;, hoặc &ldquo;Bác sĩ gia đình&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Ảnh Thumbnail */}
                    <Link href={`/blog/${post.slug}`} className="block relative h-56 overflow-hidden bg-slate-100">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {post.pillarNum && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0046c0] text-white shadow-xs">
                            {post.pillarNum}
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-slate-700 backdrop-blur-xs shadow-xs">
                          {post.pillarBadge || post.categoryLabel}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{post.readTime}</span>
                      </div>
                    </Link>

                    {/* Nội Dung Tóm Tắt */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-700">{post.author.name}</span>
                        <span>·</span>
                        <span>{post.publishedAt}</span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chân Thẻ: Nút Đọc Hướng Dẫn */}
                  <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      Tài liệu đào tạo y tế
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 group-hover:text-blue-800 transition-colors"
                    >
                      <span>Xem hướng dẫn chi tiết</span>
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer Chuẩn */}
      <LandingFooter />
    </div>
  );
}
