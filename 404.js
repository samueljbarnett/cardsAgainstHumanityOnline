exports.req404=(req,res)=>{
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>File not found!</title></head><body><h1>Oh No!</h1><p>We could not find the file you are looking for.</p><code>Error 404 - File not found</code></body></html>`)
    return res.end();
}