const constants = require("./Constants");

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    switch (statusCode) {
        case constants.ValidationError:
            res.status(statusCode).json({
                title: "Validation Error",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        case constants.Unauthorized:
            res.status(statusCode).json({
                title: "Unauthorized",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        case constants.NotFound:
            res.status(statusCode).json({
                title: "Not Found",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        case constants.InternalServerError:
            res.status(statusCode).json({
                title: "Internal Server Error",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        default:
            res.status(statusCode).json({
                title: "Server Error",
                message: err.message,
                stackTrace: err.stack
            });
            break;
    }
};

module.exports = errorHandler;