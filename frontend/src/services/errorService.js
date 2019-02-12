import http from './HttpService';

export default class errorService {

    static sendErrorMessage(error, onSuccess, onError) {
        return http.post('/v1/error-log', error).then(
            res => {
                if (res.data.success) {
                    //return onSuccess(res.data);
                } else {
                    console.log('Could not send error message');
                    //return onError(res.data);
                }
            }).catch(error => {
                console.log('Could not send error message');
                //return onError(error);
        });
    }
}