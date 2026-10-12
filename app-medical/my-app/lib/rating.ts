import prisma from './prisma';

/**
 * Recalculates and updates the average rating and review count for a Doctor or Hospital
 * based on all existing reviews in the Review table.
 */
export async function updateTargetRating(targetId: number | string, targetType: 'doctor' | 'hospital') {
  const numId = typeof targetId === 'number' ? targetId : parseInt(targetId, 10);
  if (isNaN(numId)) return { rating: 0, count: 0 };

  const where = targetType === 'doctor' ? { doctorId: numId } : { hospitalId: numId };
  
  const reviews = await prisma.review.findMany({
    where,
    select: { rating: true },
  });

  const count = reviews.length;
  const average = count > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
    : 0;
  
  const roundedAverage = Math.round(average * 10) / 10;

  if (targetType === 'doctor') {
    await prisma.doctor.update({
      where: { id: numId },
      data: { rating: roundedAverage, reviews: count },
    });
  } else {
    await prisma.hospital.update({
      where: { id: numId },
      data: { rating: roundedAverage, reviewCount: count },
    });
  }

  return { rating: roundedAverage, count };
}
