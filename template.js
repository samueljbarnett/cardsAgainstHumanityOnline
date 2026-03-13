const fs=require('fs')

let vars={
    templatePath:__dirname,
    codePath:__dirname,
};exports.vars=vars

function render(name,req,values){
    let f=fs.readFileSync(vars.templatePath+'/'+name,{encoding:"utf-8"})

    {let codeRegex=/<serverside src="[^"]*"\/>/ig;
    let a=f.match(codeRegex)
    if(a!=null){
    for(let i=0;i<a.length;i++){
        let p=a[i].slice(17,a[i].length-3)
        let c=require(vars.codePath+'/'+p)
        f=f.replace(a[i],c.rp(req,values))
    }}}
    
    {let valRegex=/<serverside value="[^"]*"\/>/ig;
    let a=f.match(valRegex)
    if(a!=null){
    for(let i=0;i<a.length;i++){
        let p=a[i].slice(19,a[i].length-3)
        f=f.replace(a[i],values[p])
    }}}

    return f
}exports.render=render