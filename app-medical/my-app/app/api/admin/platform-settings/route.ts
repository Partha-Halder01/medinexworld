import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function isSuperAdmin(userId: string) {
  if (userId === 'admin_id_from_env') return true;
  const numId = parseInt(userId, 10);
  if (isNaN(numId)) return false;
  const user = await prisma.user.findUnique({ where: { id: numId } });
  return user && user.role === 'admin';
}

export async function GET() {
  try {
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) settings = await prisma.platformSettings.create({ data: {} });
    return NextResponse.json({ ...settings, _id: settings.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, id, _id, createdAt, updatedAt, ...updates } = await req.json();
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const cleanData: any = {};
    if (updates.gstPercent !== undefined) cleanData.gstPercent = Number(updates.gstPercent) || 0;
    if (updates.discountAmount !== undefined) cleanData.discountAmount = Number(updates.discountAmount) || 0;
    if (updates.defaultPlatformFeePercent !== undefined) cleanData.defaultPlatformFeePercent = Number(updates.defaultPlatformFeePercent) || 0;
    if (updates.chamberBookingFee !== undefined) cleanData.chamberBookingFee = Math.min(10000, Math.max(0, Math.round(Number(updates.chamberBookingFee) || 0)));
    if (updates.supportEmail !== undefined) cleanData.supportEmail = String(updates.supportEmail).trim();
    if (updates.supportPhone !== undefined) cleanData.supportPhone = String(updates.supportPhone).trim();
    if (updates.emergencyPhone !== undefined) cleanData.emergencyPhone = String(updates.emergencyPhone).trim();
    if (updates.contactAddress !== undefined) cleanData.contactAddress = String(updates.contactAddress).trim();

    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: cleanData });
    } else {
      settings = await prisma.platformSettings.update({ where: { id: settings.id }, data: cleanData });
    }
    return NextResponse.json({ ...settings, _id: settings.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}