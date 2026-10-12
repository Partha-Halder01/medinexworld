import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const MAX_LIMIT = 50;

const normalizeSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const getExcerpt = (content: string, fallback = '') => {
  const source = (fallback || '').trim() || content.trim();
  return source.length <= 160 ? source : `${source.slice(0, 157)}...`;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, MAX_LIMIT)) : 20;
    const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1;
    const all = searchParams.get('all');

    const where: any = {};
    if (!all) where.isPublished = true;
    if (category) where.category = category;

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Filter by tag (JSON array stored in DB)
    const filtered = tag ? blogs.filter((b: any) => Array.isArray(b.tags) && b.tags.includes(tag)) : blogs;

    const total = await prisma.blog.count({ where });
    return NextResponse.json({ blogs: filtered.map((b: any) => ({ ...b, _id: b.id })), total, page, pages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to fetch blogs.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.content) return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });

    const baseSlug = normalizeSlug(body.slug || body.title);
    let slug = baseSlug || `post-${Date.now().toString(36)}`;
    let i = 1;
    while (await prisma.blog.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    if (!body.excerpt) body.excerpt = getExcerpt(body.content);
    if (!body.excerptHi && body.contentHi) body.excerptHi = getExcerpt(body.contentHi);
    if (typeof body.tags === 'string') body.tags = body.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (body.isPublished && !body.publishedAt) body.publishedAt = new Date();

    const blog = await prisma.blog.create({
      data: {
        title: body.title, titleHi: body.titleHi || '', slug,
        content: body.content, contentHi: body.contentHi || '',
        excerpt: body.excerpt || '', excerptHi: body.excerptHi || '',
        coverImage: body.coverImage || '',
        author: body.author || 'Medinex World',
        tags: body.tags || [],
        category: body.category || 'health-tips',
        isPublished: body.isPublished || false,
        publishedAt: body.publishedAt || null,
        viewCount: 0,
      },
    });
    return NextResponse.json({ ...blog, _id: blog.id }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create blog.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}