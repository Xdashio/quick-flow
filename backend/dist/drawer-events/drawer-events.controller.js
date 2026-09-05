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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerEventsController = void 0;
const common_1 = require("@nestjs/common");
const drawer_events_service_1 = require("./drawer-events.service");
const create_drawer_event_dto_1 = require("./dto/create-drawer-event.dto");
let DrawerEventsController = class DrawerEventsController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(limit, reason) {
        if (reason)
            return this.service.findByReason(reason);
        return this.service.findAll(limit ? parseInt(limit, 10) : 100);
    }
};
exports.DrawerEventsController = DrawerEventsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_drawer_event_dto_1.CreateDrawerEventDto]),
    __metadata("design:returntype", void 0)
], DrawerEventsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DrawerEventsController.prototype, "findAll", null);
exports.DrawerEventsController = DrawerEventsController = __decorate([
    (0, common_1.Controller)('drawer-events'),
    __metadata("design:paramtypes", [drawer_events_service_1.DrawerEventsService])
], DrawerEventsController);
//# sourceMappingURL=drawer-events.controller.js.map