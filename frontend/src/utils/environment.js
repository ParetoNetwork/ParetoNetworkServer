export default {
    baseURL: document.domain === 'localhost' ? 'http://localhost:3000' : '',
    webSocketURL: location.origin.replace(/^http/, 'ws')
}