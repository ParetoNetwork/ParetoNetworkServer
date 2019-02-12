import http from './HttpService';

export default class errorService {

    static sendErrorMessage(errorCode, error, onSuccess, onError) {
        let errorState = this.userErrorList[errorCode];

        http.post('/v1/error-log', {errorState, error})
            .then(res => {
                if (res.data.success) {
                    return onSuccess(res.data);
                } else {
                    console.log('Could not send error message');
                    return onError(res.data);
                }
            }).catch(error => {
            console.log('Could not send error message');
            return onError(error);
        });

        return errorState.userErrorList;
    }

    //This are the error messages to show to the users
    static userErrorList = {
        f1: {
            description: 'Login Error Metamask',
            userMessage: 'User could not log in to Metamask, please review you are logged to Metamask or refresh and try again',
            priority: 3
        },
        f2: {
            description: 'Login Manual Error',
            userMessage: 'User could not log in to the platform, please refresh and try again',
            priority: 3
        },
        f3: {
            description: 'Account No Tokens',
            userMessage: 'Could not retrieve user tokens',
            priority: 2
        },
        f4: {
            description: 'Error accessing the ledger wallet',
            userMessage: 'Error accessing the ledger nano wallet',
            priority: 2
        },
        f5: {
            description: 'Load Profile Error',
            userMessage: 'Error accessing the platform, please refresh and try again',
            priority: 2
        },
        f6: {
            description: 'Failed Event Feed',
            userMessage: 'Error accessing the transaction feed, please try again',
            priority: 3
        },
        f7: {
            description: 'Update Create Event',
            userMessage: 'The transaction proccess failed',
            priority: 2
        },
        f8: {
            description: 'Intel Feed Scroll',
            userMessage: 'Error retrieving new intel when scrolling the list',
            priority: 3
        },
        f9: {
            description: 'Get Leaderboard Error',
            userMessage: 'Error fetching information from leaderboard, please refresh or try again',
            priority: 3
        },
        f10: {
            description: 'Leaderboard Param Error',
            userMessage: 'Error searching by current parameter',
            priority: 4
        },
        f11: {
            description: 'Logout Error',
            userMessage: 'User logout error. If the logout was unsuccesfull please try again',
            priority: 2
        },
        f12: {
            description: 'User Authentication',
            userMessage: 'User authentication error',
            priority: 1
        },
        f13: {
            description: 'Get Ledger Nano Tokens',
            userMessage: 'Error retrieving tokens for Ledger Nano, please try again',
            priority: 2
        },
        f14: {
            description: 'Sign Wallet Error',
            userMessage: 'Error signing in with Ledger Nano, please try again',
            priority: 1
        },
        f15: {
            description: 'Content Service Upload',
            userMessage: 'Error uploading content, please try again',
            priority: 1
        },
        f16: {
            description: 'Pareto Info CoinMarket',
            userMessage: 'Error accessing Coint Market',
            priority: 3
        },
        f17: {
            description: 'Transaction Error',
            userMessage: 'Error accessing transactions',
            priority: 2
        },
        f18: {
            description: 'Post Transaction Error',
            userMessage: 'Error adding transaction, please try again',
            priority: 2
        },
        f19: {
            description: 'Create Intel Error',
            userMessage: 'Error creating intel, please try again',
            priority: 1
        },
        f20: {
            description: 'Pending Transaction Approval',
            userMessage: 'Error fetching transaction, please try again',
            priority: 2
        },
        f21: {
            description: 'SendReward',
            userMessage: 'Error sending reward, please try again',
            priority: 2
        },
        f22: {
            description: 'Distribute Reward',
            userMessage: 'Error doing distribute, please try again',
            priority: 2
        },
        f23: {
            description: 'Receipt Transaction Error',
            userMessage: 'An error occurred when waiting for the transaction, please try again',
            priority: 2
        },
        f24: {
            description: 'Address Error',
            userMessage: 'An error occurred when fetching the address',
            priority: 3
        },
        f25: {
            description: 'Get Intel Error',
            userMessage: 'Error accessing to the intel information, please try again',
            priority: 3
        },
        f26: {
            description: 'Get Content Error',
            userMessage: 'Error fetching user information, please refresh and try again',
            priority: 2
        },
        f27: {
            description: 'Get All ContentError',
            userMessage: 'Error fetching the intel content, please refresh and try again',
            priority: 3
        },
        f28: {
            description: 'Update Profile Error',
            userMessage: 'Error updating user information, please try again',
            priority: 3
        },
        f29: {
            description: 'Get Profile Error',
            userMessage: 'Error getting user information, please try again',
            priority: 2
        },
        f30: {
            description: 'Update Config Error',
            userMessage: 'Error accessing user configuration, please refresh and try again',
            priority: 2
        },
        f31: {
            description: 'Update Profile PictureError',
            userMessage: 'Error updating user profile picture, please refresh and try again',
            priority: 2
        },
        f32: {
            description: 'Socket Connection Override',
            userMessage: 'Socket connection error, intel information could not be retrieved',
            priority: 4
        }
    };
}