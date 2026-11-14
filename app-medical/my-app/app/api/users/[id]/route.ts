import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: numId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        walletBalance: true,
        familyMembers: true,
        locationLat: true,
        locationLng: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const familyMembersList = Array.isArray(user.familyMembers)
      ? user.familyMembers
      : typeof user.familyMembers === 'string'
      ? JSON.parse(user.familyMembers || '[]')
      : [];

    return NextResponse.json({
      ...user,
      _id: user.id,
      familyMembers: familyMembersList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch profile.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const body = await req.json();
    const { name, phone, newPassword, familyMembers } = body;

    const user = await prisma.user.findUnique({ where: { id: numId } });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const updateData: any = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (familyMembers !== undefined) {
      updateData.familyMembers = Array.isArray(familyMembers) ? familyMembers : [];
    }
    if (newPassword) {
      if (newPassword.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({ where: { id: numId }, data: updateData });
    const { password: _pw, ...userResponse } = updated;
    const familyMembersList = Array.isArray(userResponse.familyMembers)
      ? userResponse.familyMembers
      : typeof userResponse.familyMembers === 'string'
      ? JSON.parse((userResponse.familyMembers as any) || '[]')
      : [];

    return NextResponse.json({
      ...userResponse,
      _id: userResponse.id,
      familyMembers: familyMembersList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}
