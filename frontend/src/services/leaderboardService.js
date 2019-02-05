import http from './HttpService';

export default class LeaderboardService {
    static getLeaderboard(params, onSuccess, onError) {
        return http.get('/v1/rank', {params}).then(res => {
            if(res.data.success){
                return onSuccess(res.data.data);
            }else{
                return onError(res.data.message);
            }
        }, error => {
            console.log(error);
        });
    }
}