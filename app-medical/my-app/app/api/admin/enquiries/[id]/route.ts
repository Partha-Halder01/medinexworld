import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEnquiryFollowUpEmail } from '@/lib/email';

// PATCH /api/admin/enquiries/[id] - Admin gives follow-up, updates status, sets quote
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const enquiryId = parseInt(resolvedParams.id, 10);

    if (isNaN(enquiryId)) {
      return NextResponse.json({ error: 'Invalid Enquiry ID.' }, { status: 400 });
    }

    const body = await req.json();
    const {
      status, // 'pending' | 'in_progress' | 'contacted' | 'resolved' | 'cancelled'
      adminNotes,
      followUpMessage,
      followUpBy,
      quoteAmount,
    } = body;

    const existing = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!existing) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (followUpMessage !== undefined) {
      updateData.followUpMessage = followUpMessage;
      updateData.followUpDate = new Date();
    }

    if (followUpBy !== undefined) {
      updateData.followUpBy = followUpBy;
    }

    if (quoteAmount !== undefined) {
      const parsedQuote = quoteAmount === null || quoteAmount === '' ? null : Number(quoteAmount);
      updateData.quoteAmount = isNaN(parsedQuote as number) ? null : parsedQuote;
    }

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: updateData,
    });

    if (existing.patientEmail && followUpMessage) {
      try {
        await sendEnquiryFollowUpEmail(
          existing.patientEmail,
          existing.patientName,
          existing.type,
          followUpMessage,
          updateData.quoteAmount ?? existing.quoteAmount,
          updateData.status ?? existing.status
        );
      } catch (emailErr) {
        console.error('Failed to send follow-up email notification:', emailErr);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating enquiry:', error);
    return NextResponse.json({ error: error.message || 'Failed to update enquiry.' }, { status: 500 });
  }
}

// DELETE /api/admin/enquiries/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const enquiryId = parseInt(resolvedParams.id, 10);

    if (isNaN(enquiryId)) {
      return NextResponse.json({ error: 'Invalid Enquiry ID.' }, { status: 400 });
    }

    await prisma.enquiry.delete({ where: { id: enquiryId } });
    return NextResponse.json({ success: true, message: 'Enquiry deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting enquiry:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete enquiry.' }, { status: 500 });
  }
}
