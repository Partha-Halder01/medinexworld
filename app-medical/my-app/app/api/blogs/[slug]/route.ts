import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const blog = await prisma.blog.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
    return NextResponse.json({ ...blog, _id: blog.id });
  } catch (error: any) {
    console.error('Get blog error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog.' }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (body.isPublished && !body.publishedAt) {
      body.publishedAt = new Date();
    }
    if (body.isPublished === false) {
      body.publishedAt = null;
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.titleHi !== undefined) updateData.titleHi = body.titleHi;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.contentHi !== undefined) updateData.contentHi = body.contentHi;
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.excerptHi !== undefined) updateData.excerptHi = body.excerptHi;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt;

    const blog = await prisma.blog.update({
      where: { slug },
      data: updateData,
    });
    return NextResponse.json({ ...blog, _id: blog.id });
  } catch (error: any) {
    console.error('Update blog error:', error);
    return NextResponse.json({ error: 'Failed to update blog.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await prisma.blog.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete blog error:', error);
    return NextResponse.json({ error: 'Failed to delete blog.' }, { status: 500 });
  }
}
