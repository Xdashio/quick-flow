"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerEventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DrawerEventsService = class DrawerEventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
    async findByReason(reason) {
        return this.prisma.drawerEvent.findMany({
            where: { reason },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
};
exports.DrawerEventsService = DrawerEventsService;
exports.DrawerEventsService = DrawerEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DrawerEventsService);
//# sourceMappingURL=drawer-events.service.js.map