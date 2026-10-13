export const AppError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
