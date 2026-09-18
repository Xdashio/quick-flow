"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const SAFE_SELECT = {
    id: true,
    name: true,
    role: true,
    active: true,
    createdAt: true,
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.user.findMany({
            select: SAFE_SELECT,
            orderBy: { createdAt: 'asc' },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: SAFE_SELECT,
        });
        if (!user)
            throw new common_1.NotFoundException(`User ${id} not found`);
        return user;
    }
    assertCredentialPolicy(role, password) {
        if (role === 'cashier') {
            if (!/^\d{4,6}$/.test(password)) {
                throw new common_1.BadRequestException('Cashier credential must be a numeric PIN of 4–6 digits.');
            }
            return;
        }
        if (password.length < 8) {
            throw new common_1.BadRequestException('Manager/Admin password must be at least 8 characters.');
        }
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            throw new common_1.BadRequestException('Manager/Admin password must contain both letters and numbers.');
        }
    }
    async assertNameUnique(name, exceptId) {
        const existing = await this.prisma.user.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        });
        if (existing && existing.id !== exceptId) {
            throw new common_1.ConflictException(`A user named "${name}" already exists`);
        }
    }
    async assertNotLastAdmin(targetId, action) {
        const activeAdmins = await this.prisma.user.count({
            where: { role: 'admin', active: true },
        });
        const target = await this.prisma.user.findUnique({ where: { id: targetId } });
        const targetCounts = target?.role === 'admin' && target?.active === true;
        if (targetCounts && activeAdmins <= 1) {
            throw new common_1.BadRequestException(`Cannot ${action} the last active admin — promote another admin first.`);
        }
    }
    async create(dto, actor) {
        if (actor.role === 'cashier') {
            throw new common_1.ForbiddenException('Cashiers cannot manage staff accounts.');
        }
        if (actor.role === 'manager' && dto.role !== 'cashier') {
            throw new common_1.ForbiddenException('Managers can only create cashier accounts.');
        }
        this.assertCredentialPolicy(dto.role, dto.password);
        await this.assertNameUnique(dto.name);
        const pinHash = await bcrypt.hash(dto.password, 12);
        return this.prisma.user.create({
            data: {
                name: dto.name,
                pinHash,
                role: dto.role,
                active: true,
            },
            select: SAFE_SELECT,
        });
    }
    async update(id, dto, actor) {
        const target = await this.findOne(id);
        if (actor.role === 'cashier') {
            throw new common_1.ForbiddenException('Cashiers cannot manage staff accounts.');
        }
        if (id === actor.userId) {
            throw new common_1.ForbiddenException('You cannot edit your own account here — use your profile instead.');
        }
        if (actor.role === 'manager') {
            if (target.role !== 'cashier') {
                throw new common_1.ForbiddenException('Managers can only manage cashier accounts.');
            }
            if (dto.role !== undefined) {
                throw new common_1.ForbiddenException('Only admins can change user roles.');
            }
        }
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name)
                throw new common_1.BadRequestException('Name cannot be empty.');
            await this.assertNameUnique(name, id);
        }
        if (dto.password !== undefined) {
            this.assertCredentialPolicy(dto.role ?? target.role, dto.password);
        }
        if (target.role === 'admin') {
            if (dto.active === false) {
                await this.assertNotLastAdmin(id, 'deactivate');
            }
            if (dto.role !== undefined && dto.role !== 'admin') {
                await this.assertNotLastAdmin(id, 'demote');
            }
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.role !== undefined)
            data.role = dto.role;
        if (dto.active !== undefined)
            data.active = dto.active;
        if (dto.password !== undefined) {
            data.pinHash = await bcrypt.hash(dto.password, 12);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: SAFE_SELECT,
        });
    }
    async updateMe(actor, dto) {
        const me = await this.findOne(actor.userId);
        if (dto.name === undefined && dto.password === undefined) {
            throw new common_1.BadRequestException('Nothing to update.');
        }
        const data = {};
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name)
                throw new common_1.BadRequestException('Name cannot be empty.');
            await this.assertNameUnique(name, me.id);
            data.name = name;
        }
        if (dto.password !== undefined) {
            if (!dto.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to set a new one.');
            }
            const full = await this.prisma.user.findUnique({ where: { id: me.id } });
            const valid = full && (await bcrypt.compare(dto.currentPassword, full.pinHash));
            if (!valid) {
                throw new common_1.UnauthorizedException('Current password is incorrect.');
            }
            this.assertCredentialPolicy(me.role, dto.password);
            data.pinHash = await bcrypt.hash(dto.password, 12);
        }
        return this.prisma.user.update({
            where: { id: me.id },
            data,
            select: SAFE_SELECT,
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map