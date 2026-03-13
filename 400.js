exports.req400=(req,res)=>{
    res.writeHead(400, {'Content-Type': 'text/html'});
    res.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bad Request!</title></head><body><h1>Oh No!</h1><p>There was an error in your request.</p><code>Error 400 - Bad Request</code></body></html>`)
    return res.end();
}