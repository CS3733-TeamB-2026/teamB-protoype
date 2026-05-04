"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
exports.generateEmbedding2 = generateEmbedding2;
exports.embeddingToSql = embeddingToSql;
var transformers_1 = require("@xenova/transformers");
var embedder = null;
transformers_1.env.cacheDir = './models';
// @ts-ignore - skip image processor to avoid sharp dependency
transformers_1.env.backends.onnx.wasm.numThreads = 1;
function getEmbedder() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!embedder) return [3 /*break*/, 2];
                    console.log('[embeddings] Loading model (first time may take a moment)...');
                    return [4 /*yield*/, (0, transformers_1.pipeline)('feature-extraction', 'Xenova/all-MiniLM-L6-v2')];
                case 1:
                    embedder = _a.sent();
                    console.log('[embeddings] Model loaded.');
                    _a.label = 2;
                case 2: return [2 /*return*/, embedder];
            }
        });
    });
}
function generateEmbedding(text) {
    return __awaiter(this, void 0, void 0, function () {
        var embedder, truncated, output;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getEmbedder()];
                case 1:
                    embedder = _a.sent();
                    truncated = text.slice(0, 4000);
                    return [4 /*yield*/, embedder(truncated, { pooling: 'mean', normalize: true })];
                case 2:
                    output = _a.sent();
                    // @ts-ignore
                    return [2 /*return*/, Array.from(output.data)];
            }
        });
    });
}
var ML_SERVICE = (_a = process.env.ML_SERVICE_URL) !== null && _a !== void 0 ? _a : 'http://localhost:3001';
function generateEmbedding2(text) {
    return __awaiter(this, void 0, void 0, function () {
        var truncated, res, embedding;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    truncated = text.slice(0, 4000);
                    return [4 /*yield*/, fetch("".concat(ML_SERVICE, "/embed"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: truncated })
                        })];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error("ML Service /embed failed: ".concat(res.status));
                    return [4 /*yield*/, res.json()];
                case 2:
                    embedding = (_a.sent()).embedding;
                    return [2 /*return*/, embedding];
            }
        });
    });
}
function embeddingToSql(embedding) {
    return "[".concat(embedding.join(','), "]");
}
