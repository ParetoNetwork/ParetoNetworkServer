import axios from 'axios';

export default axios.create({
    withCredentials: true,
    baseURL: document.domain === 'localhost' ? 'http://localhost:3000' : ''
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