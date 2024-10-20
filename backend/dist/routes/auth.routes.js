"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
const signupHandler = (req, res) => {
    (0, auth_controller_1.signup)(req, res);
};
const loginHandler = (req, res) => {
    (0, auth_controller_1.login)(req, res);
};
router.post("/signup", signupHandler);
router.post("/login", loginHandler);
exports.default = router;
