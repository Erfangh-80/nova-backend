import argon2 from "argon2";

import type { PasswordHasher } from "../../application/ports/password-hasher.js";

export const argon2PasswordHasher: PasswordHasher = {
    hash(password) {
        return argon2.hash(password);
    },

    verify(hash, password) {
        return argon2.verify(hash, password);
    },
};