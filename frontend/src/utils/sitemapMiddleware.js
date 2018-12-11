import VueRouterSitemap from 'vue-router-sitemap';
import path from 'path';
import router from './routes';
import http from '../services/HttpService';

console.log(new VueRouterSitemap(router));
alert('wefwe');
export const sitemapMiddleware = () => {
    return (req, res) => {
        res.set('Content-Type', 'application/xml');

        const staticSitemap = path.resolve('dist/static', 'sitemap.xml');
        const filterConfig = {
            isValid: false,
            rules: [
                /\/localhost:8080/,
                /\*/,
            ],
        };

        new VueRouterSitemap(router).filterPaths(filterConfig).build('http://localhost:3000').save(staticSitemap);

        return res.sendFile(staticSitemap);
    };
};

http.get('/sitemap.xml', sitemapMiddleware());