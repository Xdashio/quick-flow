import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDrawerEventDto } from './dto/create-drawer-event.dto';

@Injectable()
export class DrawerEventsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDrawerEventDto) {
    return this.prisma.drawerEvent.create({
      data: {
        registerId: dto.registerId ?? null,
        userId: dto.userId ?? null,
        reason: dto.reason,
        amountCents: dto.amountCents ?? null,
      },
    });
  }

  async findAll(limit = 100) {
    return this.prisma.drawerEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  }

  async findByReason(reason: string) {
    return this.prisma.drawerEvent.findMany({
      where: { reason },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
