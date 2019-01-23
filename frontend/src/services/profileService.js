import http from './HttpService';
import environment from '../utils/environment';
import Identicon from 'identicon.js';

export default class profileService {

    static updateProfile(profile, onSuccess, onError) {
        http.post('/v1/updateuser', profile).then(res => {
            return onSuccess(res.data);
        }).catch(error => {
            return onError(error);
        });
    }aliasSlug

    //Returns the current user profile, but if send a profile parameter (address), will return the query profile
    static getProfile(onSuccess, onError, profile = null) {
        const cachedProfile = this.getProfile.profile;

        //Saves the last searched profile
        if(cachedProfile && !profile){
            return onSuccess(cachedProfile);
        }else{
            return http.get('/v1/userinfo', profile).then(res => {
                this.getProfile.profile = res.data.data;
                return onSuccess(res.data.data);
            }).catch(error => {
                return onError(error);
            });
        }

    }

    static updateConfig(onFinish){
        http.post('/v1/config_basic', {}).then(res => {
            res= res.data;

            let etherscan = "https://etherscan.io";
            switch (res.data.netWorkId) {
                case '3':{ etherscan="https://ropsten.etherscan.io"; break;}
                case '4':{ etherscan="https://rinkeby.etherscan.io";break;}
                case '42':{ etherscan="https://kovan.etherscan.io";break;}

            }
            window.localStorage.setItem('etherscan', etherscan);

            if(res.success && (res.data.intelAddress !== window.localStorage.getItem('intelAddress')
            || res.data.paretoAddress !== window.localStorage.getItem('paretoAddress')
                || res.data.netWorkId !== window.localStorage.getItem('netWorkId')
                || res.data.psignversion !== window.localStorage.getItem('psignversion'))){
                http.post('/v1/config', {}).then(res => {
                    res= res.data;
                    if(res.success ){
                        window.localStorage.setItem('intelAddress',res.data.intelAddress);
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

    //Returns a profile. If none address is defined, returns last searched user profile
    static getSpecificProfile(address, onSuccess, onError){
        const profile = this.getSpecificProfile.profile || {};

        //Cached profile
        if(profile.address === address){
            return profile;
        }else{
            http.get('/v1/userinfo/' + address).then(res => {
                if(!address) this.getSpecificProfile.profile = res.data.data;
                return onSuccess(res.data.data);
            }).catch(error => {
                return onError(error);
            });
        }
    }

    //Returns profile image url or gravatar generated image using the address
    static getProfileImage(path, pic, profileAddress){
        if (pic) return path + pic;

        //replaces not numeric hex characters: IdenticonJs only generates images based on numbers
        var data = new Identicon(profileAddress, 420).toString();
        return 'data:image/png;base64,' + data;
    }

    static uploadProfilePic(form, onSuccess, onError) {
        http.post('/upload-profile', form).then(res => {
            onSuccess(res.data.data.profile_pic);
        }).catch(error => {
            onError(error);
        });
    }
}
