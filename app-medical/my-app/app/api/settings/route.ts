import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: {} });
    }

    return NextResponse.json({
      supportEmail: settings.supportEmail || 'support@medinexworld.com',
      supportPhone: settings.supportPhone || '+91 98765 43210',
      emergencyPhone: settings.emergencyPhone || '112',
      contactAddress: settings.contactAddress || '',
      gstPercent: settings.gstPercent,
      discountAmount: settings.discountAmount,
      defaultPlatformFeePercent: settings.defaultPlatformFeePercent,
      chamberBookingFee: settings.chamberBookingFee,
    });
  } catch (error) {
    return NextResponse.json({
      supportEmail: 'support@medinexworld.com',
      supportPhone: '+91 98765 43210',
      emergencyPhone: '112',
      contactAddress: '',
    });
  }
}
