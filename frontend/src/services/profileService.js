import http from './HttpService';

export default class profileService {

    static updateProfile(profile,onSuccess, onError) {
        http.post('/v1/updateuser',profile).then(res => {
            return onSuccess(res.data);
        }).catch(error => {
            return onError(error)
        });
    }
}