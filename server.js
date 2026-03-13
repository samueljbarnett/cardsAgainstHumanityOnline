const HOST=(process.argv[3]!=undefined)?process.argv[3]:"localhost"
const PORT=(!isNaN(process.argv[2]))?Number(process.argv[2]):8080

function Log(msg){console.log(`${new Date().toISOString()}: [Cards Against Humanity] ${(typeof msg=='string')?msg:JSON.stringify(msg)}`)}

const {StaticDirectory}=require("./staticDir.js")
const templates=require("./template.js")
const {getMimeType}=require("./mime.js")
const {Game}=require("./game.js")
const {parseCookies}=require("./parseCookies.js")
const {req400}=require("./400.js")
const {req401}=require("./401.js")
const {req404}=require("./404.js")
const http=require("http")

const hexChars="0123456789ABCDEF"

const publicDir=new StaticDirectory("./public")
const templatesDir=new StaticDirectory("./templates")


templates.vars.codePath="./templateCode"
templates.vars.templatePath="./templates"


const games={}

function auth(cookies){
    if(!("GameID" in cookies)){return {"f":true,"r":0}}

    if(!(cookies["GameID"].toUpperCase() in games)){return {"f":true,"r":1}}

    const g=games[cookies["GameID"].toUpperCase()]

    if(g.pass!="" && g.pass!==cookies["GamePass"]){return {"f":true,"r":2}}

    if(cookies["ID"] && (cookies["ID"] in g.players)){
        return {
            "game":g,
            "ID":cookies["ID"]
        }
    }
    return {
        "game":g
    }
}
function authReq(req,res=undefined){
    if(req.headers.cookie==undefined)
        {if(res!=undefined){req401(req,res)};return {"f":true,"r":0}}

    const cookies=parseCookies(req.headers.cookie)
    const a=auth(cookies)
    if(res!=undefined&&a.f===true){req401(req,res)}
    return a
}

const server=http.createServer((req,res)=>{
    const url=new URL(req.url,`http://${HOST}:${PORT}`)

    if(url.pathname=="/"){url.pathname="/index.html"}


    {
        const file=publicDir.getFile(url.pathname)
        if(file!=undefined){
            res.writeHead(200,{"Content-Type":getMimeType(url.pathname)})
            res.write(file)
            res.end()
            return
        }
    }
    
    switch(url.pathname){
        case '/api/createGame':
            res.setHeader("Cache-Control","no-store")

            let points=Number(url.searchParams.get("points"))
            let pass=url.searchParams.get("pass")
            let name=url.searchParams.get("name")
            if(isNaN(points)){points=5}
            points=Math.max(1,points)
            points=Math.min(points,99)
            if(name==null||name.length<1||name.length>25){name="Player"}
            if(pass==null){pass=""}

            let gameID=""
            for(let i=0;i<8;i++){gameID+=hexChars[Math.floor(Math.random()*16)]}
            while(gameID in games){
                gameID=""
                for(let i=0;i<8;i++){gameID+=hexChars[Math.floor(Math.random()*16)]}
            }

            games[gameID]=new Game(points,pass,gameID,[
                    "./base_card_pack"
                ],name,games,
                (url.searchParams.get("playerNameResponses")==="on")?2:0,
                (url.searchParams.get("classicTurns")==="on")?true:false,
                (url.searchParams.get("allowPlayerDecks")==="on")?true:false)

            res.setHeader("Set-Cookie",[
                `ID=${games[gameID].ownerID}; Path=/`,
                `GameID=${gameID}; Path=/`,
                `GamePass=${pass}; Path=/`
            ])

            res.writeHead(301,{"Location":"/lobby-owner.html"})
            res.end()
            return

        case '/api/choose':{
            res.setHeader("Cache-Control","no-store")

            const l=authReq(req)
            if(l.f===true || l.ID==undefined){
                req401(req,res)
                return
            }

            const n=url.searchParams.get("cards")
            if(typeof n!="string"){
                req400(req,res)
                return
            }

            const split=n.split(",")
            for(let i=0;i<split.length;i++){
                split[i]=Number(split[i])
                if(isNaN(split[i])){
                    req400(req,res)
                    return
                }
            }

            l.game.choice(l.ID,split,res)
            return
        }
        case '/api/pick':{
            res.setHeader("Cache-Control","no-store")

            const l=authReq(req)
            if(l.f===true || l.ID==undefined){
                req401(req,res)
                return
            }

            const name=url.searchParams.get("player")
            if(typeof name!="string"){
                req400(req,res)
                return
            }

            l.game.pick(l.ID,name,res)
            return
        }
        case '/api/lobbyStatus':{
            res.setHeader("Cache-Control","no-store")

            const l=authReq(req)
            if(l.f===true || l.ID==undefined){
                req401(req,res)
                return
            }

            l.game.getStatus(l.ID,res)
            return
        }
        case '/api/pollLobbyStatus':{
            res.setHeader("Cache-Control","no-store")

            const l=authReq(req)
            if(l.f===true || l.ID==undefined){
                req401(req,res)
                return
            }

            l.game.pollReq(l.ID,res)
            return
        }
        case '/lobby.html':{
            const gl=authReq(req)
            res.writeHead(200,{"Content-Type":"text/html"})
            if(gl.game!=undefined && gl.game.allowPlayerDecks==true){
                res.end(templatesDir.getFile("/lobby-packs.html"))
            }else{
                res.end(templatesDir.getFile("/lobby.html"))
            }
            return
        }case '/lobby-owner.html':{
            res.writeHead(200,{"Content-Type":"text/html"})
            res.end(templatesDir.getFile("/lobby-lead.html"))
            return
    
        }case '/api/join':{
            res.setHeader("Cache-Control","no-store")

            let code=url.searchParams.get("gamecode")
            let name=url.searchParams.get("name")
            let pass=url.searchParams.get("password")
            
            let reqCookies={}
            if(req.headers.cookie!=undefined)
                {reqCookies=parseCookies(req.headers.cookie)}
            
            const cookies=[]
            if(code!=null && code!=""){reqCookies["GameID"]=code;cookies.push(`GameID=${code}; Path=/`)}
            if(pass!=null && pass!=""){reqCookies["GamePass"]=pass;cookies.push(`GamePass=${pass}; Path=/`)}
            
            const l=auth(reqCookies)
            
            let id=""
            if(l.f!==true){
                if(name==null){
                    res.setHeader("Set-Cookie",cookies)
                    res.writeHead(301,{"Location":`/name.html`})
                    res.end()
                    return
                }else{
                    id=l.game.addPlayer(name)
                    if(typeof id!="string"){
                        id=""
                    }
                }
            }
            
            if(id!=""){reqCookies["ID"]=id;cookies.push(`ID=${id};`)}
            res.setHeader("Set-Cookie",cookies)

            if(l.f===true){
                switch(l.r){
                    case 1:
                        res.writeHead(301,{"Location":"/doesNotExist.html"})
                        res.end()
                        return
                    case 2:
                        res.writeHead(301,{"Location":`/password.html`})
                        res.end()
                        return
                    default:
                        res.writeHead(301,{"Location":"/"})
                        res.end()
                        return
                }
                return
            }

            if(id==""){
                if(name==null){
                    res.writeHead(301,{"Location":`/name.html`})
                    res.end()
                    return
                }else{
                    res.writeHead(301,{"Location":`/nameExists.html`})
                    res.end()
                    return
                }
            }

            res.writeHead(301,{"Location":`/lobby.html`})
            res.end()
            
            return
        }
        case '/api/startGame':{
            res.setHeader("Cache-Control","no-store")

            const l=authReq(req)
            if(l.f===true || l.ID!==l.game.ownerID){
                req401(req,res)
                return
            }

            const success=l.game.start()

            res.writeHead(200,{"Content-Type":"application/json"})
            res.write(`{"Success":${success}}`)
            res.end()
            return
        }
        case '/api/kick':{
            res.setHeader("Cache-Control","no-store")

            const l=authReq(req)
            if(l.f===true || l.ID!==l.game.ownerID){
                req401(req,res)
                return
            }

            const name=url.searchParams.get("player")

            if(!(name in l.game.names)){
                req400(req,res)
                return
            }
            if(l.game.ownerID===l.game.names[name]){
                req400(req,res)
                return
            }

            l.game.removePlayer(name)

            res.writeHead(200)
            res.end()
            return
        }
        case '/api/end':{
            res.setHeader("Cache-Control","no-store")

            const l=authReq(req)
            if(l.f===true || l.ID!==l.game.ownerID){
                req401(req,res)
                return
            }

            l.game.delete()

            res.writeHead(200)
            res.end()
            return
        }
    }

    req404(req,res)
})

server.listen(PORT,HOST,
    ()=>{Log(`CAH server listening on http://${HOST}:${PORT}`)})