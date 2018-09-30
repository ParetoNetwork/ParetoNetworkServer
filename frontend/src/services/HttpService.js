import axios from 'axios';
import Vue from 'vue';

Vue.http = axios.create({
    withCredentials: true,
    baseURL: document.domain === 'localhost' ? 'http://localhost:3000' : '',
});

export default Vue.http;