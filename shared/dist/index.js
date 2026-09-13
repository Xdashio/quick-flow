"use strict";
/**
 * @pos/shared — canonical types for POS monorepo
 * Imported by backend, register, and dashboard — never duplicated.
 * Strict TypeScript 7, integer cents for money (never float).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_UNIT_TYPES = void 0;
exports.SUPPORTED_UNIT_TYPES = [
    "each",
    "kg",
    "g",
    "lb",
    "oz",
    "litre",
    "ml",
    "dozen",
    "pack",
    "box",
];
