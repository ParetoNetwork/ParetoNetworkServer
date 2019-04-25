import http from './HttpService';

import errorService from "./errorService";

export default class ReportService {

    static reportWeekly(onSuccess, onError) {
        http.post('/v1/reportweekly').then(
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

    static reportMonthly(onSuccess, onError) {
        http.post('/v1/reportmonthly').then(
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




}