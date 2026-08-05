const constants = require("./Constants");

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    switch (statusCode) {
        case constants.ValidationError:
            res.json({
                title: "Validation Error",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        case constants.Unauthorized:
            res.json({
                title: "Unauthorized",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        case constants.NotFound:
            res.json({
                title: "Not Found",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        case constants.InternalServerError:
            res.json({
                title: "Internal Server Error",
                message: err.message,
                stackTrace: err.stack
            });
            break;
        default:
            console.log("No Error handled specifically by middleware:", err);
            break;
    }
};

module.exports = errorHandler;