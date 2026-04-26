import * as usersService from "../services/userService.js";
export async function getByUsername(req, res, next) {
    try {
        const username = req.params.username;
        if (typeof username !== "string" || !username) {
            res.status(400).json({ error: "username is required" });
            return;
        }
        res.json(await usersService.getPublicProfile(username));
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=userController.js.map