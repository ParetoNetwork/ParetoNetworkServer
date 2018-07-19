import http from './HttpService';

export default class profileService {

    static updateProfile(profile, onSuccess, onError) {
        http.post('/v1/updateuser', profile).then(res => {
            return onSuccess(res.data);
        }).catch(error => {
            return onError(error);
        });
    }

    static getProfile(onSuccess, onError, profile = null) {
        http.get('/v1/userinfo', profile).then(res => {
            return onSuccess(res.data.data);
        }).catch(error => {
            return onError(error);
        });
    }

    static uploadProfilePic(form, onSuccess, onError) {
        http.post('/upload-profile', form).then(res => {
            onSuccess(res.data.filename);
        }).catch(error => {
            onError(error);
        });
    }
}