import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const body = await req.json();
    const { name, phone, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { id: numId } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const updateData: any = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (newPassword) {
      if (newPassword.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({ where: { id: numId }, data: updateData });
    const { password: _pw, ...userResponse } = updated;
    return NextResponse.json({ ...userResponse, _id: userResponse.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}