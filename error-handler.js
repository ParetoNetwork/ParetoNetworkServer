const errorHandler = module.exports = {};

// List all messages
errorHandler.tokenMissingMessage = 'Token missing, failed to authenticate token.';
errorHandler.jwtFailedMessage = 'Failed to authenticate token.';
errorHandler.invalidAddressMessage = 'Invalid Address';
errorHandler.zeroParetoBalanceMessage = 'We are sorry, you will need Pareto balance in order to be able to Sign In.';
errorHandler.signatureFailedMessage = 'Signature did not match.';
errorHandler.contentMissingMessage = 'POST body missing, needs address, title and body';
errorHandler.bodyMissingMessage = 'POST body missing';
errorHandler.appkeyMissingMessage = 'POST body missing, needs keys';
errorHandler.nullResponseMessage = 'null response';
errorHandler.addressNotFound = 'Address not found in DataBase';


//Custom Response
/**
 * Custom error
 * @param message
 * @return {{success: boolean, message: *}}
 */
errorHandler.getError = function (message)  {
    return {success: false, message: errorHandler.validateMessage(message)};
};

/**
 * Custom error
 * @param message
 * @param code
 * @return {{success: boolean, message: *, code: number}}
 */
errorHandler.getErrorWithCode = function (message, code)  {
    return {success: false, message: errorHandler.validateMessage(message), code: code};
};

/**
 * Success data
 * @param data
 * @return {{success: boolean, data: *}}
 */
errorHandler.getSuccess = function (data)  {
    return {success: true, data: data};
};

// validatingMessage
errorHandler.validateMessage = function(message){
    let msg = message;
    if( typeof  message === 'object' && message.message){
        msg = message.message;
    }
    if(msg.indexOf('Invalid JSON RPC') > -1){
        msg = 'Ethereum server response failed , please try again';
    }

    return msg;
}


//Template Errors
errorHandler.tokenMissingError = function () {
    return errorHandler.getErrorWithCode(errorHandler.tokenMissingMessage,401);
};
errorHandler.jwtFailedError = function () {
    return errorHandler.getErrorWithCode(errorHandler.jwtFailedMessage,401);
};
errorHandler.invalidAddressError = function () {
    return errorHandler.getError(errorHandler.invalidAddressMessage);
};
errorHandler.zeroParetoBalanceError = function () {
    return errorHandler.getError(errorHandler.zeroParetoBalanceMessage);
};
errorHandler.signatureFailedError = function () {
    return errorHandler.getError(errorHandler.signatureFailedMessage);
};
errorHandler.contentMissingError = function () {
    return errorHandler.getError(errorHandler.contentMissingMessage);
};
errorHandler.bodyMissingError = function () {
    return errorHandler.getError(errorHandler.bodyMissingMessage);
};
errorHandler.appkeyMissingError = function () {
    return errorHandler.getError(errorHandler.appkeyMissingMessage);
};
errorHandler.nullResponseError = function () {
    return errorHandler.getError(errorHandler.nullResponseMessage);
};
