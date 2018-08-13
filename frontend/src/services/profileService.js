import http from './HttpService';
import environment from '../utils/environment';

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

    static getSpecificProfile(onSuccess, onError, address){
       // console.log(address);
        http.get('/v1/userinfo/' + address).then(res => {
            return onSuccess(res.data.data);
        }).catch(error => {
            return onError(error);
        });
    }

    static getProfileImage(path, pic){
        if (pic) return path + pic;
        return environment.baseURL + '/profile-image';
        //return 'http://www.uriux.com/wp-content/uploads/2017/09/male-placeholder.jpg';
    }

    static uploadProfilePic(form, onSuccess, onError) {
        http.post('/upload-profile', form).then(res => {
            onSuccess(res.data.data.profile_pic);
        }).catch(error => {
            onError(error);
        });
    }
}