import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, BlogDetailView } from '@/features/blog';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';

export const instant = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return {
      title: 'Bài viết không tồn tại | FamiDoc',
      description: 'Không tìm thấy cẩm nang hoặc tài liệu đào tạo yêu cầu.',
    };
  }
  return {
    title: `${post.title} | FamiDoc Cẩm Nang Y Tế`,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <ServerAuthSessionBoundary>
        <BlogDetailView post={post} />
      </ServerAuthSessionBoundary>
    </Suspense>
  );
}
