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
errorHandler.getError = function (error)  {
    return {success: false, message: errorHandler.validateMessage(error)};
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
errorHandler.validateMessage = function(error){
    let msg = error;
    if( typeof  error === 'object' ){
        if(error.message){
            msg = error.message;
        }else{
            if(error.userMessage){
                msg = error.userMessage;
            }
        }
       console.log(JSON.stringify(error))
    } else{
        if( typeof  error === 'string' ){
            console.log('code: unKnown, systemError: '+msg);
        }
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



errorHandler.backendErrorList = {
    b1: {
        code: 'b1',
        description: 'Missing sign in parameters',
        userMessage: 'Sign In Error, ',
        priority: 1
    },
    b2: {
        code: 'b2',
        description: 'Signature did not match on Sign In.',
        userMessage: 'Signature did not match on Sign In.',
        priority: 1
    },
    b3: {
        code: 'b3',
        description: 'Address not found in DataBase',
        userMessage: 'Your information is not synchronizated  yet from Ethereum network, please come back later',
        priority: 1
    },
    b4: {
        code: 'b4',
        description: 'Error retrieve Rank',
        userMessage: 'Error retrieve inforamtion about ranking',
        priority: 2
    },
    b5: {
        code: 'b5',
        description: 'Error to save ranking information in redis',
        userMessage: 'Ranking information is not available',
        priority: 1
    },
    b6: {
        code: 'b6',
        description: 'Invalid Address',
        userMessage: 'The address sent is invalid',
        priority: 2
    },
    b7: {
        code: 'b7',
        description: 'Address without Pareto balance',
        userMessage: 'We are sorry, you will need Pareto balance in order to be able to Sign In.',
        priority: 2
    },
    b8: {
        code: 'b8',
        description: 'Error generating score',
        userMessage: 'There was an error generating the score.',
        priority: 1
    },
    b9: {
        code: 'b9',
        description: 'Error Add Exponent',
        userMessage: '',
        priority: 2
    },
    b10: {
        code: 'b10',
        description: 'Score aproximation All Score',
        userMessage: 'Score aproximation all score failed',
        priority: 1
    },
    b11: {
        code: 'b11',
        description: 'Error Calculating real Score',
        userMessage: 'Error Calculating real Score',
        priority: 1
    },
    b12: {
        code: 'b12'
    }
};