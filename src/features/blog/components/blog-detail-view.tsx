'use client';

import React from 'react';
import Link from 'next/link';
import { getRelatedPosts } from '../data/blog-posts';
import type { BlogPost, BlogTrainingStep, BlogFaq } from '../types';
import { LandingHeader, LandingFooter } from '@/features/landing';

interface BlogDetailViewProps {
  post: BlogPost;
}

export function BlogDetailView({ post }: BlogDetailViewProps) {
  const relatedPosts = getRelatedPosts(post.slug, 3);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased font-sans flex flex-col justify-between">
      {/* 1. Header Trang Chủ */}
      <LandingHeader />

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-blue-600 transition-colors">
                Cẩm nang &amp; Đào tạo Y tế
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold truncate max-w-md">
                {post.pillarNum ? `${post.pillarNum}: ${post.title}` : post.title}
              </span>
            </nav>
          </div>
        </div>

        {/* Article Header & Hero */}
        <header className="bg-white border-b border-slate-200/80 pt-8 pb-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {post.pillarNum && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0046c0] border border-blue-200 shadow-2xs">
                  {post.pillarNum} · {post.pillarBadge}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {post.categoryLabel}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>{post.readTime}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {post.subtitle}
            </p>

            {/* Author Profile */}
            <div className="flex items-center gap-3.5 pt-3 border-t border-slate-100">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
              />
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{post.author.name}</span>
                  <span className="material-symbols-outlined text-[15px] text-blue-600" title="Chuyên gia xác thực CCHN">
                    verified
                  </span>
                </div>
                <div className="text-xs text-slate-500">{post.author.role}</div>
              </div>
              <div className="ml-auto text-xs text-slate-400 hidden sm:block">
                Cập nhật: {post.publishedAt}
              </div>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 max-h-[420px]">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover object-center max-h-[420px]"
              />
            </div>
          )}

          {/* Hộp Mục Tiêu Đào Tạo & Huấn Luyện (Learning Objectives) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border border-blue-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
              <span className="material-symbols-outlined text-lg text-blue-700">school</span>
              <span>Mục Tiêu Đào Tạo &amp; Giá Trị Chăm Sóc Hướng Đến</span>
            </div>
            <ul className="space-y-2">
              {post.learningObjectives.map((obj: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                    ✓
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phần Mở Đầu / Bối Cảnh (Overview) */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-blue-600" />
              <span>Tổng quan giải pháp y tế</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
              {post.overview}
            </p>
          </section>

          {/* Các Bước Hướng Dẫn & Đào Tạo Thực Tế (Training Steps) */}
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-blue-600" />
              <span>Quy trình 4 bước thực hiện chuẩn y khoa</span>
            </h2>

            <div className="space-y-4 pt-2">
              {post.steps.map((step: BlogTrainingStep) => (
                <div
                  key={step.stepNumber}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-200 transition-colors space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center justify-center text-xs tabular-nums shrink-0">
                      {step.stepNumber}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
                    {step.content}
                  </p>

                  {step.note && (
                    <div className="ml-11 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">
                        info
                      </span>
                      <span>{step.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Hộp Những Điều Cốt Lõi Cần Nhớ (Key Takeaways) */}
          <section className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span>Điểm Cốt Lõi Cần Ghi Nhớ</span>
            </div>
            <ul className="space-y-2">
              {post.keyTakeaways.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Câu Hỏi Thường Gặp (FAQs) */}
          {post.faqs.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-5 rounded-full bg-blue-600" />
                <span>Giải đáp thắc mắc thường gặp</span>
              </h2>

              <div className="space-y-3">
                {post.faqs.map((faq: BlogFaq, idx: number) => (
                  <div key={idx} className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 space-y-1.5">
                    <div className="text-sm font-bold text-slate-900 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">Q:</span>
                      <span>{faq.question}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Banner Kêu Gọi Hành Động (CTA Box) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold">
                Bảo vệ sức khỏe gia đình bạn ngay hôm nay
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-md">
                Đăng ký bác sĩ riêng, nhận tư vấn Telehealth 24/7 và kích hoạt hồ sơ bệnh án điện tử cho cả gia đình.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/packages"
                className="px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs sm:text-sm hover:bg-blue-50 transition-colors shadow-sm"
              >
                Chọn gói chăm sóc
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 font-semibold text-xs sm:text-sm hover:bg-white/20 transition-colors"
              >
                Nhận tư vấn y khoa
              </Link>
            </div>
          </div>

          {/* Bài Viết / Trụ Cột Liên Quan */}
          <section className="pt-6 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Khám phá các trụ cột chăm sóc khác
              </h3>
              <Link href="/blog" className="text-xs font-semibold text-blue-600 hover:underline">
                Xem tất cả cẩm nang
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      {rel.pillarNum || rel.categoryLabel}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 font-normal">
                      {rel.subtitle}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                    <span>Đọc tiếp</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* 3. Footer Chuẩn Trang Chủ */}
      <LandingFooter />
    </div>
  );
}
