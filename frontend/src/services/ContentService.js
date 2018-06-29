import http from './HttpService';

/* eslint-disable no-console */
export default class ContentService {


    static uploadContent(content, onSuccess, onError) {
        http.post('/v1/content', content).then(res => {
            return onSuccess(res);

        }).catch(error => {
            return onError(error);

        });
    }

}

