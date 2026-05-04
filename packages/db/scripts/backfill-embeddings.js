"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Backfills embeddings for Employee, Collection, and ServiceRequest rows that
 * don't have an embedding yet. Run after adding the embedding columns via
 * `prisma db push`.
 *
 * Usage: pnpm --filter db exec ts-node scripts/backfill-embeddings.ts
 */
var dotenv_1 = require("dotenv");
var path_1 = require("path");
(0, dotenv_1.config)({ path: (0, path_1.resolve)(process.cwd(), '../../apps/backend/.env') });
var prisma_1 = require("../lib/prisma");
var embeddings_1 = require("../../../apps/backend/lib/embeddings");
function backfillTable(label, rows, table) {
    return __awaiter(this, void 0, void 0, function () {
        var success, failed, _i, rows_1, row, embedding, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n[".concat(label, "] ").concat(rows.length, " rows to embed"));
                    success = 0, failed = 0;
                    _i = 0, rows_1 = rows;
                    _a.label = 1;
                case 1:
                    if (!(_i < rows_1.length)) return [3 /*break*/, 12];
                    row = rows_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 10, , 11]);
                    return [4 /*yield*/, (0, embeddings_1.generateEmbedding)(row.text)];
                case 3:
                    embedding = _a.sent();
                    if (!(table === "Employee")) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma_1.prisma.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["UPDATE \"Employee\" SET embedding = ", "::vector WHERE id = ", ""], ["UPDATE \"Employee\" SET embedding = ", "::vector WHERE id = ", ""])), (0, embeddings_1.embeddingToSql)(embedding), row.id)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 5:
                    if (!(table === "Collection")) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma_1.prisma.$executeRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["UPDATE \"Collection\" SET embedding = ", "::vector WHERE id = ", ""], ["UPDATE \"Collection\" SET embedding = ", "::vector WHERE id = ", ""])), (0, embeddings_1.embeddingToSql)(embedding), row.id)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, prisma_1.prisma.$executeRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["UPDATE \"ServiceRequest\" SET embedding = ", "::vector WHERE id = ", ""], ["UPDATE \"ServiceRequest\" SET embedding = ", "::vector WHERE id = ", ""])), (0, embeddings_1.embeddingToSql)(embedding), row.id)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    console.log("  [".concat(row.id, "] ok"));
                    success++;
                    return [3 /*break*/, 11];
                case 10:
                    err_1 = _a.sent();
                    console.error("  [".concat(row.id, "] failed:"), err_1);
                    failed++;
                    return [3 /*break*/, 11];
                case 11:
                    _i++;
                    return [3 /*break*/, 1];
                case 12:
                    console.log("  Success: ".concat(success, ", Failed: ").concat(failed));
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, employees, collections, serviceReqs;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        prisma_1.prisma.$queryRaw(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n            SELECT id, \"firstName\", \"lastName\", persona::text FROM \"Employee\" WHERE embedding IS NULL\n        "], ["\n            SELECT id, \"firstName\", \"lastName\", persona::text FROM \"Employee\" WHERE embedding IS NULL\n        "]))),
                        prisma_1.prisma.$queryRaw(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n            SELECT id, \"displayName\" FROM \"Collection\" WHERE embedding IS NULL\n        "], ["\n            SELECT id, \"displayName\" FROM \"Collection\" WHERE embedding IS NULL\n        "]))),
                        prisma_1.prisma.$queryRaw(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n            SELECT id, name, type::text, notes FROM \"ServiceRequest\" WHERE embedding IS NULL\n        "], ["\n            SELECT id, name, type::text, notes FROM \"ServiceRequest\" WHERE embedding IS NULL\n        "]))),
                    ])];
                case 1:
                    _a = _b.sent(), employees = _a[0], collections = _a[1], serviceReqs = _a[2];
                    return [4 /*yield*/, backfillTable('Employee', employees.map(function (e) { return ({ id: e.id, text: "".concat(e.firstName, " ").concat(e.lastName, " ").concat(e.persona) }); }), 'Employee')];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, backfillTable('Collection', collections.map(function (c) { return ({ id: c.id, text: c.displayName }); }), 'Collection')];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, backfillTable('ServiceRequest', serviceReqs.map(function (sr) { var _a, _b; return ({ id: sr.id, text: [(_a = sr.name) !== null && _a !== void 0 ? _a : '', sr.type, (_b = sr.notes) !== null && _b !== void 0 ? _b : ''].join(' ') }); }), 'ServiceRequest')];
                case 4:
                    _b.sent();
                    console.log('\nBackfill complete.');
                    return [4 /*yield*/, prisma_1.prisma.$disconnect()];
                case 5:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
