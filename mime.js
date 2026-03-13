/**
 * A function for getting the mime type of a file
 * @function getMimeType
 * @author 4MMWJ
 * @version 1.1.0
 */

/**
 * Returns the mime type of a file
 * @param {*} p File path
 * @returns {String} The mime type of the file. Empty string if unknown.
 */
function getMimeType(p){
    let t=p.split('.')
    t=t[t.length-1]
    switch(t){
        case 'css':t='text/css';break;
        case 'js':t='text/javascript';break;
        case 'html':t='text/html';break;
        case 'svg':t='image/svg+xml';break;
        case 'json':t='application/json';break;
        case 'ico':t='image/ico';break;
        case 'txt':t='text/plain';break;
        case 'png':t='image/png';break;
        case 'xml':t='application/xml';break;
        case 'woff2':t='font/woff2';break;
        default:t='';break;
    };return t
};exports.getMimeType=getMimeType