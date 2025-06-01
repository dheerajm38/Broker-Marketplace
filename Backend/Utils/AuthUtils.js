import jwt from "jsonwebtoken";

export const generateAccessToken = (moderator) => {
    return jwt.sign(
        {
            user: {
                moderator_id: moderator.moderator_id,
                role: moderator.role,
                name: moderator.name,
            },
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "20m",
        }
    );
};

export const generateRefreshToken = (moderator) => {
    return jwt.sign(
        {
            user: {
                moderator_id: moderator.moderator_id,
                role: moderator.role,
                name: moderator.name,
            },
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: "30d",
        }
    );
};

export const generateUserAccessToken = (user) => {
    return jwt.sign(
        {
            user: {
                user_id: user.user_id,
                role: user.role,
                name: user.personal_details?.fullName,
            },
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "20m",
        }
    );
};

export const generateUserRefreshToken = (user) => {
    return jwt.sign(
        {
            user: {
                user_id: user.user_id,
                role: user.role,
                name: user.personal_details?.fullName,
            },
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: "30d",
        }
    );
};