exports.req401=(req,res)=>{
    res.writeHead(401, {'Content-Type': 'text/html'});
    res.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Unauthorized!</title></head><body><h1>Oh No!</h1><p>You are not allowed to access this resource.</p><code>Error 401 - Unauthorized</code></body></html>`)
    return res.end();
}