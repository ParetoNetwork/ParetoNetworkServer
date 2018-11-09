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
        profileService.updateConfig();
        return http.get('/v1/userinfo', profile).then(res => {
            return onSuccess(res.data.data);
        }).catch(error => {
            return onError(error);
        });
    }

    static updateConfig(onFinish){
        http.post('/v1/config_basic', {}).then(res => {
            res= res.data;
            if(res.success && (res.data.intelAddress !== window.localStorage.getItem('intelAddress')
            || res.data.paretoAddress !== window.localStorage.getItem('paretoAddress')
                || res.data.netWorkId !== window.localStorage.getItem('netWorkId')
                || res.data.etherscan !== window.localStorage.getItem('etherscan')
                || res.data.psignversion !== window.localStorage.getItem('psignversion'))){
                http.post('/v1/config', {}).then(res => {
                    res= res.data;
                    if(res.success ){
                        window.localStorage.setItem('intelAddress',res.data.intelAddress);
                        window.localStorage.setItem('etherscan',res.data.etherscan);
                        window.localStorage.setItem('paretoAddress',res.data.paretoAddress);
                        window.localStorage.setItem('netWorkId',res.data.netWorkId);
                        window.localStorage.setItem('psignversion',res.data.psignversion);
                        window.localStorage.setItem('intelc',JSON.stringify(res.data.intel));
                        window.localStorage.setItem('paretoc',JSON.stringify(res.data.pareto));
                    }
                    if (onFinish) onFinish();
                }).catch(error => {if (onFinish) onFinish(); });
            }
        }).catch(error => {if (onFinish) onFinish(); });
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
    }

    static uploadProfilePic(form, onSuccess, onError) {
        http.post('/upload-profile', form).then(res => {
            onSuccess(res.data.data.profile_pic);
        }).catch(error => {
            onError(error);
        });
    }
}