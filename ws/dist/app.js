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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const cluster_1 = __importDefault(require("cluster"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("./utils");
// import os from "os";
const StreamManager_1 = require("./StreamManager");
dotenv_1.default.config();
const cors = 1; // os.cpus().length  // for vertical scaling
if (cluster_1.default.isPrimary) {
    for (let i = 0; i < cors; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on("disconnect", () => {
        process.exit();
    });
}
else {
    main();
}
function createHttpServer() {
    return http_1.default.createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("Hello, this is some data from the server!");
    });
}
function handleConnection(ws) {
    return __awaiter(this, void 0, void 0, function* () {
        ws.on("message", (raw) => __awaiter(this, void 0, void 0, function* () {
            const { type, data } = JSON.parse(raw.toString()) || {};
            switch (type) {
                case "join-room":
                    yield handleJoinRoom(ws, data);
                    break;
                default:
                    yield handleUserAction(ws, type, data);
            }
        }));
        ws.on("close", () => {
            StreamManager_1.RoomManager.getInstance().disconnect(ws);
        });
    });
}
function handleJoinRoom(ws, data) {
    return __awaiter(this, void 0, void 0, function* () {
        jsonwebtoken_1.default.verify(data.token, process.env.NEXTAUTH_SECRET, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err, decoded) => {
            if (err) {
                console.error(err);
                (0, utils_1.sendError)(ws, "Token verification failed");
            }
            else {
                StreamManager_1.RoomManager.getInstance().joinRoom(data.spaceId, decoded.creatorId, decoded.userId, ws, data.token);
            }
        });
    });
}
function processUserAction(type, data) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (type) {
            case "cast-vote":
                yield StreamManager_1.RoomManager.getInstance().castVote(data.userId, data.streamId, data.vote, data.spaceId);
                break;
            case "add-to-queue":
                yield StreamManager_1.RoomManager.getInstance().addToQueue(data.spaceId, data.userId, data.url);
                break;
            case "play-next":
                yield StreamManager_1.RoomManager.getInstance().queue.add("play-next", {
                    spaceId: data.spaceId,
                    userId: data.userId,
                });
                break;
            case "remove-song":
                yield StreamManager_1.RoomManager.getInstance().queue.add("remove-song", Object.assign(Object.assign({}, data), { spaceId: data.spaceId, userId: data.userId }));
                break;
            case "empty-queue":
                yield StreamManager_1.RoomManager.getInstance().queue.add("empty-queue", Object.assign(Object.assign({}, data), { spaceId: data.spaceId, userId: data.userId }));
                break;
            case "pay-and-play-next":
                yield StreamManager_1.RoomManager.getInstance().payAndPlayNext(data.spaceId, data.userId, data.url);
                break;
            default:
                console.warn("Unknown message type:", type);
        }
    });
}
function handleUserAction(ws, type, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = StreamManager_1.RoomManager.getInstance().users.get(data.userId);
        if (user) {
            data.userId = user.userId;
            yield processUserAction(type, data);
        }
        else {
            (0, utils_1.sendError)(ws, "You are unauthorized to perform this action");
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const server = createHttpServer();
        const wss = new ws_1.WebSocketServer({ server });
        yield StreamManager_1.RoomManager.getInstance().initRedisClient();
        wss.on("connection", (ws) => handleConnection(ws));
        const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 8080;
        server.listen(PORT, () => {
            console.log(`${process.pid}: WebSocket server is running on ${PORT}`);
        });
    });
}
