const fs=require("fs")

const noPacks=`<h1>It appears that you don't have any card packs.</h1>
<a href="/newPack.html">Click here to create a new one.</a>`

function rp(req,values){
    let html="<ol>"
    
    const filePath=`./accountData/${values.l.u.i}/cardPacks.json`
    
    if(!fs.existsSync(filePath))
        {return noPacks}

    const packs=JSON.parse(fs.readFileSync(filePath,"utf-8"))
    const names=Object.keys(packs)

    if(names.length==0)
        {return noPacks}

    for(let i=0;i<names.length;i++){
        html+=`<li><a href="/editPack.html?pack=${names[i]}">${names[i]}</a></li>`
    }

    html+=`</ol><a href="/newPack.html">Create a new pack.</a>`

    return html
};exports.rp=rp