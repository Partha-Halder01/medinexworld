import prisma from '@/lib/prisma';
import { SPECIALTIES } from '@/lib/data';

export interface SpecialtyItem {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  doctorCount?: number;
}

/**
 * Ensures initial default specialties are seeded into the database if the table is empty.
 */
export async function ensureDefaultSpecialtiesSeeded(): Promise<void> {
  try {
    const existing = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*) as count FROM \`specialties\`
    `;
    const count = Number(existing[0]?.count || 0);
    if (count === 0) {
      for (const name of SPECIALTIES) {
        await prisma.$executeRaw`
          INSERT INTO \`specialties\` (\`name\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
          VALUES (${name}, true, NOW(), NOW())
          ON DUPLICATE KEY UPDATE \`name\` = \`name\`
        `;
      }
    }
  } catch (error) {
    console.error('Error ensuring default specialties seeded:', error);
  }
}

/**
 * Returns all specialties with doctor usage count for admin view.
 */
export async function getSpecialtiesForAdmin(): Promise<SpecialtyItem[]> {
  await ensureDefaultSpecialtiesSeeded();
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.icon,
        s.isActive,
        s.createdAt,
        s.updatedAt,
        COUNT(d.id) AS doctorCount
      FROM \`specialties\` s
      LEFT JOIN \`doctors\` d ON LOWER(TRIM(d.specialty)) = LOWER(TRIM(s.name))
      GROUP BY s.id, s.name, s.description, s.icon, s.isActive, s.createdAt, s.updatedAt
      ORDER BY s.name ASC
    `;

    return rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      description: r.description ? String(r.description) : null,
      icon: r.icon ? String(r.icon) : null,
      isActive: Boolean(r.isActive === true || r.isActive === 1 || r.isActive === '1'),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      doctorCount: Number(r.doctorCount || 0),
    }));
  } catch (error) {
    console.error('Error fetching admin specialties:', error);
    return SPECIALTIES.map((name, idx) => ({
      id: idx + 1,
      name,
      isActive: true,
      createdAt: new Date().toISOString(),
      doctorCount: 0,
    }));
  }
}

/**
 * Returns active specialty names for dropdowns (used by doctor registration & doctor profile).
 */
export async function getActiveSpecialtyNames(): Promise<string[]> {
  await ensureDefaultSpecialtiesSeeded();
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT \`name\` FROM \`specialties\` WHERE \`isActive\` = 1 OR \`isActive\` = true ORDER BY \`name\` ASC
    `;
    const names = rows.map((r) => String(r.name).trim()).filter(Boolean);
    if (names.length > 0) {
      return names;
    }
    return [...SPECIALTIES];
  } catch (error) {
    console.error('Error fetching active specialty names:', error);
    return [...SPECIALTIES];
  }
}

/**
 * Creates a new specialty (Admin only).
 */
export async function createSpecialty(data: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<SpecialtyItem> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error('Specialty name is required.');
  }
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new Error('Specialty name must be between 2 and 100 characters.');
  }

  // Check for duplicate name
  const existing = await prisma.$queryRaw<any[]>`
    SELECT id, name FROM \`specialties\` WHERE LOWER(\`name\`) = LOWER(${trimmedName}) LIMIT 1
  `;
  if (existing.length > 0) {
    throw new Error(`A specialty named "${trimmedName}" already exists.`);
  }

  await prisma.$executeRaw`
    INSERT INTO \`specialties\` (\`name\`, \`description\`, \`icon\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
    VALUES (${trimmedName}, ${data.description?.trim() || null}, ${data.icon?.trim() || null}, true, NOW(), NOW())
  `;

  const created = await prisma.$queryRaw<any[]>`
    SELECT * FROM \`specialties\` WHERE LOWER(\`name\`) = LOWER(${trimmedName}) LIMIT 1
  `;

  const r = created[0];
  return {
    id: Number(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : null,
    icon: r.icon ? String(r.icon) : null,
    isActive: Boolean(r.isActive === true || r.isActive === 1 || r.isActive === '1'),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    doctorCount: 0,
  };
}

/**
 * Updates a specialty (Admin only).
 */
export async function updateSpecialty(
  id: number,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
  }
): Promise<SpecialtyItem> {
  const existing = await prisma.$queryRaw<any[]>`
    SELECT * FROM \`specialties\` WHERE \`id\` = ${id} LIMIT 1
  `;
  if (existing.length === 0) {
    throw new Error('Specialty not found.');
  }

  const current = existing[0];
  let newName = current.name;
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error('Specialty name cannot be empty.');
    // Check if new name conflicts with another specialty
    const duplicate = await prisma.$queryRaw<any[]>`
      SELECT id FROM \`specialties\` WHERE LOWER(\`name\`) = LOWER(${trimmed}) AND \`id\` != ${id} LIMIT 1
    `;
    if (duplicate.length > 0) {
      throw new Error(`Another specialty named "${trimmed}" already exists.`);
    }
    newName = trimmed;
  }

  const newDescription = data.description !== undefined ? data.description.trim() || null : current.description;
  const newIcon = data.icon !== undefined ? data.icon.trim() || null : current.icon;
  const newIsActive = data.isActive !== undefined ? Boolean(data.isActive) : Boolean(current.isActive);

  await prisma.$executeRaw`
    UPDATE \`specialties\`
    SET \`name\` = ${newName},
        \`description\` = ${newDescription},
        \`icon\` = ${newIcon},
        \`isActive\` = ${newIsActive},
        \`updatedAt\` = NOW()
    WHERE \`id\` = ${id}
  `;

  return {
    id,
    name: newName,
    description: newDescription,
    icon: newIcon,
    isActive: newIsActive,
    createdAt: current.createdAt,
    updatedAt: new Date(),
  };
}

/**
 * Deletes a specialty (Admin only).
 */
export async function deleteSpecialty(id: number): Promise<{ success: boolean; affectedDoctors: number }> {
  const existing = await prisma.$queryRaw<any[]>`
    SELECT * FROM \`specialties\` WHERE \`id\` = ${id} LIMIT 1
  `;
  if (existing.length === 0) {
    throw new Error('Specialty not found.');
  }

  const specialtyName = existing[0].name;
  const doctorsWithSpecialty = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as count FROM \`doctors\` WHERE LOWER(TRIM(\`specialty\`)) = LOWER(TRIM(${specialtyName}))
  `;
  const doctorCount = Number(doctorsWithSpecialty[0]?.count || 0);

  await prisma.$executeRaw`
    DELETE FROM \`specialties\` WHERE \`id\` = ${id}
  `;

  return { success: true, affectedDoctors: doctorCount };
}
