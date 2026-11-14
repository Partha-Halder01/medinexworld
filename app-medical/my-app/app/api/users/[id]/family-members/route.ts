import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export interface FamilyMemberItem {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  createdAt?: string;
}

// GET /api/users/[id]/family-members - Retrieve user's family members
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: numId },
      select: { id: true, familyMembers: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const members: FamilyMemberItem[] = Array.isArray(user.familyMembers)
      ? (user.familyMembers as any)
      : typeof user.familyMembers === 'string'
      ? JSON.parse(user.familyMembers || '[]')
      : [];

    return NextResponse.json({ familyMembers: members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch family members.' }, { status: 500 });
  }
}

// POST /api/users/[id]/family-members - Add a new family member
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const body = await req.json();
    const { name, age, gender } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Family member name is required.' }, { status: 400 });
    }

    const parsedAge = parseInt(String(age), 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      return NextResponse.json({ error: 'Please enter a valid age between 0 and 125.' }, { status: 400 });
    }

    const validGenders = ['Male', 'Female', 'Other'];
    const normalizedGender = validGenders.includes(gender) ? gender : 'Male';

    const user = await prisma.user.findUnique({
      where: { id: numId },
      select: { id: true, familyMembers: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const currentMembers: FamilyMemberItem[] = Array.isArray(user.familyMembers)
      ? (user.familyMembers as any)
      : typeof user.familyMembers === 'string'
      ? JSON.parse(user.familyMembers || '[]')
      : [];

    const newMember: FamilyMemberItem = {
      id: `fm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      age: parsedAge,
      gender: normalizedGender as 'Male' | 'Female' | 'Other',
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...currentMembers, newMember];

    await prisma.user.update({
      where: { id: numId },
      data: { familyMembers: updatedList as any },
    });

    return NextResponse.json({
      success: true,
      familyMembers: updatedList,
      newMember,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add family member.' }, { status: 500 });
  }
}

// DELETE /api/users/[id]/family-members?memberId=... - Remove a family member
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    let memberId = searchParams.get('memberId');

    if (!memberId) {
      try {
        const body = await req.json();
        memberId = body?.memberId;
      } catch {}
    }

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: numId },
      select: { id: true, familyMembers: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const currentMembers: FamilyMemberItem[] = Array.isArray(user.familyMembers)
      ? (user.familyMembers as any)
      : typeof user.familyMembers === 'string'
      ? JSON.parse(user.familyMembers || '[]')
      : [];

    const updatedList = currentMembers.filter(m => m.id !== memberId);

    await prisma.user.update({
      where: { id: numId },
      data: { familyMembers: updatedList as any },
    });

    return NextResponse.json({
      success: true,
      familyMembers: updatedList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to remove family member.' }, { status: 500 });
  }
}
