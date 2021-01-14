import { UserNamePasswordInput } from "src/inputs/usernamePasswordInput";

export const validateRegister = ( options: UserNamePasswordInput) => {
    if (!options.email.includes('@')) {
        return [
                {
                    field: "email",
                    message: "Must be an valid email"
                },
        ];
    }

    if (options.username.includes('@')) {
        return [
                {
                    field: "username",
                    message: "Username cannot have @"
                },
        ]
    }

    if (options.username.length <= 2) {
        return [
                {
                    field: "username",
                    message: "length must be greater than 2"
                },
        ]
    }

    if (options.password.length <= 2) {
        return [
                {
                    field: "password",
                    message: "length must be greater than 2"
                },
        ]
    }

    return null;
}