const playerList=[]
let playerName

function addPlayer(name){
    if(playerList.includes(name)){return}
    
    playerList.push(name)
    if(playerList.length>=3){
        const e=document.getElementById("start")
        if(e!=null){
            e.disabled=false
        }
    }

    const element=document.createElement("li")
    element.textContent=name
    element.id="player-"+name
    document.getElementById("players").appendChild(element)
    if(name!=playerName && isOwner===true){
        const button=document.createElement("button")
        button.textContent="Kick"
        button.onclick=()=>kickPlayer(name)
        element.appendChild(button)
    }
    console.log(`"${name}" has joined.`)
}

function kickPlayer(name){
    const statusPoll=new XMLHttpRequest()
    statusPoll.open("GET","/api/kick?player="+name)
    statusPoll.send()
}

function receivedStatus(e){
    if(e.target.status!=200)
        {document.location.assign("/");return}
    
    const res=JSON.parse(e.target.response)
    switch(res.Event){
        case "Disconnect":{
            const i=playerList.indexOf(res.Name)
            playerList.splice(i,1)

            const element=document.getElementById("player-"+res.Name)
            document.getElementById("players").removeChild(element)
            break;
        }
        
        case "Full Status":{
            if(res.State!="lobby"){
                document.location.assign("/game.html")
                return
            }
            playerName=res.Name
            for(let i=0;i<res.Players.length;i++)
                {addPlayer(res.Players[i])}
            document.getElementById("lobbyID").textContent=res.GameID
            console.log(res)
            break;
        }

        case "Join":{
            addPlayer(res.Name)
            break;
        }

        case "Start":
            document.location.assign("/game.html")
            return;

        case "Packs":
            setActivePacks(res.Packs)
            break

        case "End":
        case "Kick":
            document.location.assign("/")
            return;
    }

    pollStatus()
}

function pollStatus(full=false){
    const statusPoll=new XMLHttpRequest()
    statusPoll.open("GET",(full)?"/api/lobbyStatus":"/api/pollLobbyStatus")
    statusPoll.onload=receivedStatus
    statusPoll.send()
}

pollStatus(full=true)


function startGame(){
    const statusPoll=new XMLHttpRequest()
    statusPoll.open("GET","/api/startGame")
    statusPoll.send()
}


// function removePack(){
//     const split=this.parentElement.id.split("-")
//     split.shift()
//     const id=split.shift()
//     const name=encodeURIComponent(split.join("-"))

//     const req=new XMLHttpRequest()
//     req.open("GET",`/api/removePack?id=${id}&name=${name}`)
//     req.send()
// }
// function addPack(){
//     const split=this.parentElement.id.split("-")
//     const id=split.shift()
//     const name=encodeURIComponent(split.join("-"))

//     const req=new XMLHttpRequest()
//     req.open("GET",`/api/addPack?id=${id}&name=${name}`)
//     req.send()
// }

const userPacksList=document.getElementById("userPacks")
const sharedPacksList=document.getElementById("sharedPacks")
const officialPacksList=document.getElementById("officialPacks")
const publicPacksList=document.getElementById("publicPacks")
const currentPacksList=document.getElementById("currentPacks")
let activePacks=[]

function setActivePacks(packs){
    while(currentPacksList.childElementCount>0){
        currentPacksList.removeChild(currentPacksList.children[0])
    }

    const newActivePacks=[]
    
    for(let i=0;i<packs.length;i++){
        const id=`${packs[i].userID}-${packs[i].name}`
        
        newActivePacks.push(id)
    
        addPackToList(currentPacksList,packs[i].name,packs[i].userID,packs[i].userName,removePack,"active-")
    
        const e=document.getElementById(id)
        if(e!=null){
            e.hidden=true
            e.ariaHidden=true
        }
    }

    for(let i=0;i<activePacks.length;i++){
        if(!newActivePacks.includes(activePacks[i])){
            const e=document.getElementById(activePacks[i])
            if(e==null){continue}
            e.hidden=false
            e.ariaHidden=false
        }
    }
    activePacks=newActivePacks
}
function getActivePacks(){
    const req=new XMLHttpRequest()
    req.open("GET","/api/getPacks")
    req.onload=()=>{
        if(req.status!=200){return}
        setActivePacks(JSON.parse(req.response).Packs)
    }
    req.send()
}

function addPackToList(list,name,id=0,userName=undefined,onclick=addPack,prefix=""){
    //console.log(list,name,id,userName)
    const e=document.createElement("li")
    e.id=`${prefix}${id}-${name}`

    const button=document.createElement("button")
    button.onclick=onclick

    if(userName!=undefined && id!=0){
        const userElement=document.createElement("span")
        userElement.textContent=userName
        button.appendChild(userElement)
    }

    const nameElement=document.createElement("span")
    nameElement.textContent=name
    button.appendChild(nameElement)

    e.appendChild(button)
    list.appendChild(e)
}
function populateCardLists(){
    const res=JSON.parse(this.response)
    console.log(res)
    
    if(this.status!=200){
        userPacksList.hidden=true
        userPacksList.ariaHidden=true
        document.getElementById("userPacksLabel").hidden=true
        document.getElementById("userPacksLabel").ariaHidden=true
        
        sharedPacksList.hidden=true
        sharedPacksList.ariaHidden=true
        document.getElementById("sharedPacksLabel").hidden=true
        document.getElementById("sharedPacksLabel").ariaHidden=true
    }else{
        for(let i=0;i<res.user.length;i++){
            addPackToList(userPacksList,res.user[i],res.userID)
        }
        for(let i=0;i<res.shared.length;i++){
            addPackToList(sharedPacksList,res.shared[i].name,res.shared[i].userID,res.shared[i].userName)
        }
    }
    for(let i=0;i<res.official.length;i++){
        addPackToList(officialPacksList,res.official[i])
    }
    for(let i=0;i<res.public.length;i++){
        if(res.public[i].userID==res.userID){continue}
        if(document.getElementById(`${res.public[i].userID}-${res.public[i].name}`)!==null){continue}
        addPackToList(publicPacksList,res.public[i].name,res.public[i].userID,res.public[i].userName)
    }

    getActivePacks()
}

function getCardLists(){
    const req=new XMLHttpRequest()
    req.open("GET","/api/availablePacks")
    req.onload=populateCardLists
    req.send()
}
// getCardLists()