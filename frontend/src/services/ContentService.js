import http from './HttpService';

/* eslint-disable no-console */
export default class ContentService {


    static uploadContent(content, onSuccess, onError) {
        http.post('/v1/content', content).then(res => {
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

