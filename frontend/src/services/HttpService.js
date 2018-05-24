import axios from 'axios/index';

export default axios.create({
    headers: {
        'Accept': 'application/json',

    }, withCredentials: true
});

// export default class HttpService {
//     static get(url, data) {
//         return http.get(url, data);
//     }
//
//     static post(url, data, config) {
//         return axios.post(url, data, config);
//     }
// }