/* httpResponses.js module
 * @version 0.0.0
 * @author 4MMWJ
 * 
 * Middlewares for sending http status codes with nice HTML responses. Currently
 * only includes a small selection of codes at the moment.
 * 
 * ===== Quick Function Reference =====
 * setErrorHtml(string:string)
 * 
 * errReq(IncomingMessage:req, ServerResponse:res, number:code)
 * reqXXX(object:req, object:res)
 */


let errHTML=`<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>ERRTEXT</title>
    </head>
    <body>
        <h1>Oh No!</h1>
        <p>ERRDESC</p>
        <code>Error ERRCODE - ERRTEXT</code>
    </body>
</html>`

/**
 * Set the template HTML that errors will send to clients. The substrings
 * ERRTEXT, ERRDESC, and ERRCODE will be replaced before sending to the client.
 * 
 * @param {string} string - HTML template
 */
function setErrorHtml(string){
    if(typeof string!=="string"){throw 'Error html must be of type "string".'}
    errHTML=string
};exports.setErrorHtml=setErrorHtml

const errorCodes={
    400:{
        text:"Bad Request!",
        desc:"There was an error in your request."
    },
    401:{
        text:"Unauthorized!",
        desc:"You are need authentication to access this resource."
    },
    403:{
        text:"Forbidden!",
        desc:"You are not permitted to access this resource."
    },
    404:{
        text:"Not Found!",
        desc:"We could not find the file you are looking for."
    },
    413:{
        text:"Content Too Large!",
        desc:"Your submission was too large."
    },
    418:{
        text:"I'm a Teapot!",
        desc:"I can not be used to brew coffee."
    },

    500:{
        text:"Internal Server Error!",
        desc:"There has been an error with the server."
    },
    501:{
        text:"Not Implemented!",
        desc:"This method has not been implemented."
    },
}

function generateErrorHTML(type){
    error={}

    if(typeof type != "number"){
        error.code=500
    }

    if(typeof errorCodes[type]!="object"){
        error={
            errText:"Unknown Error!",
            errDesc:"There was an error."
        }
    }else{
        if(typeof errorCodes[type].text!="string"){
            error.text="Unknown Error!"
        }else{
            error.text=errorCodes[type].text
        }

        if(typeof errorCodes[type].desc!="string"){
            error.desc="There was an error."
        }else{
            error.desc=errorCodes[type].desc
        }
    }


    return errHTML
        .replaceAll("ERRCODE", error.code)
        .replaceAll("ERRTEXT", error.text)
        .replaceAll("ERRDESC", error.desc)
}

/**
 * Middleware for sending error statuses to a client.
 * 
 * @param {*} req - An HTTP IncomingMessage object
 * @param {*} res - An HTTP ServerResponse object
 * @param {number} code - HTTP status code to send
 * @returns Return of calling res.end()
 */
exports.errReq=(req,res,code=400)=>{
    if(errorCodes[code]==undefined){
        code=500
    }

    res.writeHead(code, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(code))
    return res.end();
}


exports.req400=(req,res)=>{
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(400))
    return res.end();
}
exports.req401=(req,res)=>{
    res.writeHead(401, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(401))
    return res.end();
}
exports.req403=(req,res)=>{
    res.writeHead(403, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(403))
    return res.end();
}
exports.req404=(req,res)=>{
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(404))
    return res.end();
}
exports.req413=(req,res)=>{
    res.writeHead(413, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(413))
    return res.end();
}
exports.req418=(req,res)=>{
    res.writeHead(418, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(418))
    return res.end();
}


exports.req500=(req,res)=>{
    res.writeHead(500, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(500))
    return res.end();
}
exports.req501=(req,res)=>{
    res.writeHead(501, {'Content-Type': 'text/html'});
    res.write(generateErrorHTML(501))
    return res.end();
}