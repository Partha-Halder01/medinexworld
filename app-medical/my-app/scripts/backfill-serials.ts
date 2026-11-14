import prisma from '../lib/prisma';

async function backfillSerials() {
  console.log('--- Backfilling Appointment Serial Numbers ---');
  const appointments = await prisma.appointment.findMany({
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${appointments.length} total appointments.`);

  // Group appointments by TargetKey (doctorId or hospitalId) + Date (visitDate or date)
  const groups: Record<string, typeof appointments> = {};

  for (const appt of appointments) {
    const targetKey = appt.doctorId ? `doc_${appt.doctorId}` : appt.hospitalId ? `hosp_${appt.hospitalId}` : 'general';
    const dateKey = appt.visitDate || appt.date || 'unknown';
    const groupKey = `${targetKey}__${dateKey}`;

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(appt);
  }

  for (const [key, groupAppts] of Object.entries(groups)) {
    console.log(`Processing group ${key}: ${groupAppts.length} appointments`);
    let serial = 1;
    for (const appt of groupAppts) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { serialNumber: serial },
      });
      console.log(`  -> Appointment #${appt.id} (${appt.date} ${appt.slot}): Serial #${serial}`);
      serial++;
    }
  }

  console.log('--- Serial Numbers Backfill Complete ---');
}

backfillSerials()
  .catch((err) => {
    console.error('Error backfilling serials:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
