function parseCookies(cookieString){
    const c=cookieString.split('; ')
    const cookies={}

    for(let i=0;i<c.length;i++){
        let x=c[i].split('=');
        if(x.length!=2){continue}
        cookies[x[0].trim()]=decodeURIComponent(x[1].trim())
    }

    return cookies
}exports.parseCookies=parseCookies