import * as authService from "../services/authService.js";
import * as userRepo from "../models/userRepository.js";
export async function register(req, res, next) {
    try {
        const result = await authService.register(req.body || {});
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
export async function login(req, res, next) {
    try {
        const result = await authService.login(req.body || {});
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
export async function logout(req, res, next) {
    try {
        await authService.logout(req.token ?? null);
        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}
export function me(req, res) {
    res.json(userRepo.publicView(req.user ?? null));
}
//# sourceMappingURL=authContoller.js.map