import http from './HttpService';

import errorService from "./errorService";

export default class productService {

    static listProducts(onSuccess, onError) {
        http.get('/v1/listproducts').then(
            res => {
                if(res.data.success){
                    return onSuccess(res.data);
                }else{
                    return onError(errorService.sendErrorMessage('f28', res.data.message));
                }
            }).catch(error => {
            return onError(errorService.sendErrorMessage('f28', error));
        });
    }



    static createOrder(order ,onSuccess, onError) {
        http.post('/v1/createorder', order).then(
            res => {
                if(res){
                    return onSuccess(res.data);
                }else{
                    return onError(errorService.sendErrorMessage('f28', res));
                }
            }).catch(error => {
            return onError(errorService.sendErrorMessage('f28', error));
        });
    }

    static payOrder(token, order , user_email ,onSuccess, onError) {
        var params = {token: token, order: order, email: user_email}
        http.post('/v1/payment', params).then(
            res => {
                if(res){
                    return onSuccess(res.data);
                }else{
                    return onError(errorService.sendErrorMessage('f28', res));
                }
            }).catch(error => {
            return onError(errorService.sendErrorMessage('f28', error));
        });
    }

    static showShopping(onSuccess, onError){

        http.post('/v1/showshoppingcar').then(
            res => {
                if(res){
                    return onSuccess(res.data);
                }else{
                    return onError(errorService.sendErrorMessage('f28', res));
                }
            }).catch(error => {
            return onError(errorService.sendErrorMessage('f28', error));
        });
    }
}