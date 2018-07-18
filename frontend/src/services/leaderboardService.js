import http from './HttpService';

export default class LeaderboardService {
    static getLeaderboard(params, onSuccess, onError) {
        const {rank, limit, page} = params;
        return http.get('/v1/rank?rank=' + rank + '&limit=' + limit + '&page=' + page, {
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
}