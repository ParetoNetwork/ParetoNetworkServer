import http from './HttpService';

export default class errorService {

    static sendErrorMessage(errorCode, error) {
        let errorState = this.userErrorList[errorCode];

        http.post('/v1/error-log', {errorState, error})
            .then(res => {
            }).catch(error => {
            console.log(error);
        });
        return errorState.userMessage;
    }

    //This are the error messages to show to the users
    static userErrorList = {
        f1: {
            code: 'f1',
            description: 'Login Error Metamask',
            userMessage: 'User could not log in to Metamask, please review you are logged to Metamask or refresh and try again',
            priority: 3
        },
        f2: {
            code: 'f2',
            description: 'Login Manual Error',
            userMessage: 'User could not log in to the platform, please refresh and try again',
            priority: 3
        },
        f3: {
            code: 'f3',
            description: 'Account No Tokens',
            userMessage: 'Could not retrieve user tokens',
            priority: 2
        },
        f4: {
            code: 'f4',
            description: 'Error accessing the ledger wallet',
            userMessage: 'Error accessing the ledger nano wallet',
            priority: 2
        },
        f5: {
            code: 'f5',
            description: 'Load Profile Error',
            userMessage: 'Error accessing the platform, please refresh and try again',
            priority: 2
        },
        f6: {
            code: 'f6',
            description: 'Failed Event Feed',
            userMessage: 'Error accessing the transaction feed, please try again',
            priority: 3
        },
        f7: {
            code: 'f7',
            description: 'Update Create Event',
            userMessage: 'The transaction proccess failed',
            priority: 2
        },
        f8: {
            code: 'f8',
            description: 'Intel Feed Scroll',
            userMessage: 'Error retrieving new intel when scrolling the list',
            priority: 3
        },
        f9: {
            code: 'f9',
            description: 'Get Leaderboard Error',
            userMessage: 'Error fetching information from leaderboard, please refresh or try again',
            priority: 3
        },
        f10: {
            code: 'f10',
            description: 'Leaderboard Param Error',
            userMessage: 'Error searching by current parameter',
            priority: 4
        },
        f11: {
            code: 'f11',
            description: 'Logout Error',
            userMessage: 'User logout error. If the logout was unsuccesfull please try again',
            priority: 2
        },
        f12: {
            code: 'f12',
            description: 'User Authentication',
            userMessage: 'User authentication error',
            priority: 1
        },
        f13: {
            code: 'f13',
            description: 'Get Ledger Nano Tokens',
            userMessage: 'Error retrieving tokens for Ledger Nano, please try again',
            priority: 2
        },
        f14: {
            code: 'f14',
            description: 'Sign Wallet Error',
            userMessage: 'Error signing in with Ledger Nano, please try again',
            priority: 1
        },
        f15: {
            code: 'f15',
            description: 'Content Service Upload',
            userMessage: 'Error uploading content, please try again',
            priority: 1
        },
        f16: {
            code: 'f16',
            description: 'Pareto Info CoinMarket',
            userMessage: 'Error accessing Coint Market',
            priority: 3
        },
        f17: {
            code: 'f17',
            description: 'Transaction Error',
            userMessage: 'Error accessing transactions',
            priority: 2
        },
        f18: {
            code: 'f18',
            description: 'Post Transaction Error',
            userMessage: 'Error adding transaction, please try again',
            priority: 2
        },
        f19: {
            code: 'f19',
            description: 'Create Intel Error',
            userMessage: 'Error creating intel, please try again',
            priority: 1
        },
        f20: {
            code: 'f20',
            description: 'Pending Transaction Approval',
            userMessage: 'Error fetching transaction, please try again',
            priority: 2
        },
        f21: {
            code: 'f21',
            description: 'SendReward',
            userMessage: 'Error sending reward, please try again',
            priority: 2
        },
        f22: {
            code: 'f22',
            description: 'Distribute Reward',
            userMessage: 'Error doing distribute, please try again',
            priority: 2
        },
        f23: {
            code: 'f23',
            description: 'Receipt Transaction Error',
            userMessage: 'An error occurred when waiting for the transaction, please try again',
            priority: 2
        },
        f24: {
            code: 'f24',
            description: 'Address Error',
            userMessage: 'An error occurred when fetching the address',
            priority: 3
        },
        f25: {
            code: 'f25',
            description: 'Get Intel Error',
            userMessage: 'Error accessing to the intel information, please try again',
            priority: 3
        },
        f26: {
            code: 'f26',
            description: 'Get Content Error',
            userMessage: 'Error fetching user information, please refresh and try again',
            priority: 2
        },
        f27: {
            code: 'f27',
            description: 'Get All ContentError',
            userMessage: 'Error fetching the intel content, please refresh and try again',
            priority: 3
        },
        f28: {
            code: 'f28',
            description: 'Update Profile Error',
            userMessage: 'Error updating user information, please try again',
            priority: 3
        },
        f29: {
            code: 'f29',
            description: 'Get Profile Error',
            userMessage: 'Error getting user information, please try again',
            priority: 2
        },
        f30: {
            code: 'f30',
            description: 'Update Config Error',
            userMessage: 'Error accessing user configuration, please refresh and try again',
            priority: 2
        },
        f31: {
            code: 'f31',
            description: 'Update Profile PictureError',
            userMessage: 'Error updating user profile picture, please refresh and try again',
            priority: 2
        },
        f32: {
            code: 'f32',
            description: 'Socket Connection Override',
            userMessage: 'Socket connection error, intel information could not be retrieved',
            priority: 4
        },
        f33: {
            code: 'f33',
            description: 'No Pareto Amount. Transaction cancelled',
            userMessage: 'It seems you do not have a token amount. The transaction was cancelled',
            priority: 2
        },
        f34: {
            code: 'f34',
            description: 'No Pareto Amount. Transaction cancelled',
            userMessage: 'There was an error accessing the account. The transaction was cancelled',
            priority: 1
        },
        f35: {
            code: 'f35',
            description: 'Setup Provider Error',
            userMessage: 'Could not initialize your current provider',
            priority: 2
        },
        f36: {
            code: 'f36',
            description: 'Current user does not match wallet account',
            userMessage: 'Current user does not match wallet account',
            priority: 2
        }
    };
}