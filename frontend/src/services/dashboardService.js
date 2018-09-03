import http from './HttpService';

export default class dashboardService {
    static getAddress(onSuccess, onError) {
        return http.get('/v1/address', {
            withCredentials: true
        }).then(res => {
            if(res.data.success){
                return onSuccess(res.data.data);
            }else{
                return onError(res.data.message);
            }
        }).catch(error => {
            return onError(error);
        });
    }

    // static getIntel(onSuccess, onError) {
    //     http.get('/intel', {
    //         withCredentials: true
    //     }).then(res => {
    //         if(res.data.success){
    //             return onSuccess(res.data.data);
    //         }else{
    //             return onError(res.data.message);
    //         }
    //     }).catch(error => {
    //         return onError(error);
    //     });
    // }

    static getIntel(onSuccess, onError, intel) {
        return http.get('/v1/content/' + intel).then(res => {
            if(res.data.success){
                return onSuccess(res.data.data);
            }else{
                return onError(res.data.message);
            }
        }).catch(error => {
            return onError(error)
        });
    }

    static getContent(onSuccess, onError) {
        return http.get('/v1/content/me').then(res => {
            if(res.data.success){
                return onSuccess(res.data.data);
            }else{
                return onError(res.data.message);
            }
        }).catch(error => {
            return onError(error)
        });
    }

    static getAllContent(onSuccess, onError) {
        return http.get('/v1/content').then(res => {
            console.log(res);
            if(res.data.success){
                return onSuccess(res.data.data);
            }else{
                return onError(res.data.message);
            }
        }).catch(error => {
            return onError(error)
        });
    }
}