import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Read-only for now — locations/registers are seeded, not yet manageable
 * from the dashboard. This module exists so other features (e.g. the
 * inventory stock-receiving form) can list locations for a picker.
 */
@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.location.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException(`Location ${id} not found`);
    return location;
  }
}
