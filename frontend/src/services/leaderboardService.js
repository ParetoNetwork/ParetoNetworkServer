import http from './HttpService';

export default class LeaderboardService {
    static getLeaderboard(params, onSuccess, onError) {
        const {rank, limit, page} = params;
        return http.get('/v1/rank?rank=' + rank + '&limit=' + limit + '&page=' + page, {
            withCredentials: true
        }).then(res => {
            return onSuccess(res.data);
        }).catch(error => {
            return onError(error);
        });
    }
}