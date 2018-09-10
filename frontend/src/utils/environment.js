export default {
    baseURL: document.domain === 'localhost' ? 'http://localhost:3000' : '',
    baseUrlSocket : document.domain === 'localhost' ? 'ws://localhost:8787' : 'wss://'+document.domain+':8787'
}