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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginToSlack = void 0;
const fs = __importStar(require("fs/promises"));
const fss = __importStar(require("fs"));
const Delay_1 = require("../Utils/Delay");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
//NOW SLACK SENDS AN EMAIL TO ENTER A CODE
const SLACKCHANNEL = process.env.SLACK_CLIENT_URL;
const WS = process.env.SLACK_WORKSPACE_URL;
const EMAIL = process.env.SLACK_EMAIL;
const COOKIES_FOLDER_PATH = 'cookies/';
const COOKIES_FILE_NAME = 'slack-session-cookies.json';
const COOKIES_FILE_PATH = COOKIES_FOLDER_PATH + COOKIES_FILE_NAME;
function loginToSlack(page, delayToLogin) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (fss.existsSync(COOKIES_FILE_PATH)) {
                const getCookies = yield fs.readFile(COOKIES_FILE_PATH);
                const cookies = JSON.parse(getCookies.toString());
                for (const cookie of cookies.cookies) {
                    yield page.setCookie(cookie);
                }
                console.log('set cookies');
                yield page.goto(SLACKCHANNEL);
            }
            else {
                yield login(page);
                //give some time to login with email code
                yield (0, Delay_1.delay)(delayToLogin);
                yield goToWsAndSaveCookies(page);
            }
        }
        catch (err) {
            throw err;
        }
    });
}
exports.loginToSlack = loginToSlack;
function login(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.goto(WS);
        yield page.type('#signup_email', EMAIL);
        //await delay(10000)
        yield page.click('#submit_btn');
        yield page.waitForNavigation({ waitUntil: 'networkidle0' });
    });
}
function goToWsAndSaveCookies(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.goto(SLACKCHANNEL);
        const cookies = yield page.cookies();
        saveCookies(cookies);
    });
}
function saveCookies(cookies) {
    return __awaiter(this, void 0, void 0, function* () {
        yield createFolderIfDoesntExist(COOKIES_FOLDER_PATH);
        const cks = {
            cookies: cookies
        };
        const cksStr = JSON.stringify(cks, null, 2);
        fs.writeFile(COOKIES_FILE_PATH, cksStr);
    });
}
function createFolderIfDoesntExist(folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.stat(folderPath);
        }
        catch (error) {
            console.error(`${folderPath} directory doesn't exist.`);
            try {
                yield fs.mkdir(folderPath);
                console.log('Created directory:', folderPath);
            }
            catch (error) {
                console.error('Failed to create directory.');
                throw error;
            }
        }
    });
}
