// 글로벌 라우터 인스턴스
import { Router } from "../lib/index.js";
import { BASE_URL } from "../constants.js";
import { ServerRouter } from "../lib/ServerRouter.js";

export const router = typeof window === "undefined" ? new ServerRouter(BASE_URL) : new Router(BASE_URL);
