import http from './HttpService';

export default class dashboardService {
    static getAddress(onSuccess, onError) {
        http.get('/v1/address', {
            withCredentials: true
        }).then(res => {
            return onSuccess(res.data);
        }).catch(error => {
            return onError(error);
        });
    }

    static getContent(onSuccess, onError) {
        http.get('/v1/content/me').then(res => {
            return onSuccess(res.data);
        }).catch(error => {
            return onError(error)
        });
    }
    static getAllContent(onSuccess, onError) {
        http.get('/v1/content').then(res => {
            return onSuccess(res.data);
        }).catch(error => {
            return onError(error)
        });
    }
}