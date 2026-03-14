const fs=require("fs")
const {Deck}=require("./deck.js")
const {req400}=require("./httpResponses.js")

let VARS={
    PROJNAME:"Cards Against Humanity",
}
exports.setVars=(v)=>{VARS=v}

function Log(msg){console.log(`${new Date().toISOString()}: [${VARS.PROJNAME}] ${(typeof msg=='string')?msg:JSON.stringify(msg)}`)}


function loadDeck(path,ID=undefined){
    const cards={
        "prompts":new Deck(),
        "responses":new Deck()
    }

    let f=""

    try{
        f=fs.readFileSync(path,"utf-8")
    }catch{}
    
    
    const lines=f.split("\n")
    
    let i=0;
    while(i<lines.length){
        if(!lines[i].includes("_")){i++;break}
        cards.prompts.add(lines[i])
        i++
    }
    while(i<lines.length){
        cards.responses.add(lines[i])
        i++
    }
    
    return cards
}

class Game{
    static #hexCars="0123456789ABCDEF"
    static maxPlayers=64
    static #generatePlayerId(){
        let id=""
        for(let i=0;i<16;i++)
            {id+=Game.#hexCars[Math.floor(Math.random()*16)]}
        return id
    }
    static #pollTimeout=29000
    static #gameTimeout=180000// Must be larger than pollTimeout
    static #playerTimeout=60000// Must be larger than pollTimeout

    constructor(points,pass,id,packs,name,gamesList,allowPlayerResponses,classicTurns,allowPlayerDecks){
        this.points=points
        this.pass=pass
        this.id=id
        this.packs=packs
        this.handSize=10

        this.names={}
        this.players={}
        this.turnOrder=[]
        this.playerResponses={}
        this.prompt=undefined
        this.numResponsesForPrompt

        this.allowPlayerResponses=allowPlayerResponses
        this.allowPlayerDecks=allowPlayerDecks
        this.classicTurns=classicTurns

        this.state="lobby"
        this.currentPlayer=0

        this.ownerID=this.addPlayer(name)

        this.gamesList=gamesList

        this.deleteTimer=setTimeout(()=>{
            this.timeoutFunc()},Game.#gameTimeout)
    }

    drawResponse(){
        let card
        if(this.ignoreDiscard){
            card=this.responses.cards[Math.floor(Math.random()*this.responses.cards.length)]
        }else{
            card=this.responses.draw()
            if(card==undefined){
                this.responses.join(this.responseDiscard)
                this.responses.shuffle()
                card=this.responses.draw()
            }
            this.responseDiscard.add(card)
        }

        return card
    }

    drawPrompt(){
        let card=this.prompts.draw()
        if(card==undefined){
            this.prompts.join(this.promptDiscard)
            this.prompts.shuffle()
            card=this.prompts.draw()
        }
        this.promptDiscard.add(card)
        return card
    }

    startRespondPhase(){
        // Refill cards
        for(let i=0;i<this.turnOrder.length;i++){
            const id=this.names[this.turnOrder[i]]
            const deck=this.players[id].deck
            while(deck.cards.length<this.handSize){
                deck.add(this.drawResponse())
            }

            this.event({
                "Event":"Deck",
                "Cards":deck.cards
            },id)
        }

        // Draw a new prompt
        this.prompt=this.drawPrompt()
        // Count the number of responses required for the prompt
        this.numResponsesForPrompt=0
        for(let i=0;i<this.prompt.length;i++){
            if(this.prompt[i]=="_")
            {this.numResponsesForPrompt++}
        }

        // Change the state that the game is in
        this.state="respond"
        
        // Notify all of the players
        this.eventAll({
            "Event":"Start Respond",
            "State":this.state,
            "Turn":this.turnOrder[this.currentPlayer],
            "Prompt":this.prompt,
            "NumResponses":this.numResponsesForPrompt
        })
    }
    startPickPhase(){
        // Set up the responses to send anonymously
        this.anonymousResponses={}
        for(let i=0;i<this.turnOrder.length;i++){
            if(i==this.currentPlayer){continue}
            let aID=Game.#generatePlayerId()
            while(aID in this.anonymousResponses)
                {aID=Game.#generatePlayerId()}
            this.anonymousResponses[aID]={
                "name":this.turnOrder[i],
                "cards":[]
            }
            const chosen=this.playerResponses[this.names[this.turnOrder[i]]]
            const deck=this.players[this.names[this.turnOrder[i]]].deck
            for(let a=0;a<chosen.length;a++)
            {this.anonymousResponses[aID].cards.push(deck.cards[chosen[a]])}
        }
        
        // Move to the next phase
        this.state="pick"

        // Remove old cards from the hand
        for(let i=0;i<this.turnOrder.length;i++){
            if(i==this.currentPlayer){continue}
            const chosen=this.playerResponses[this.names[this.turnOrder[i]]].sort()
            const deck=this.players[this.names[this.turnOrder[i]]].deck
            for(let a=chosen.length-1;a>=0;a--)
                {deck.pick(chosen[a])}
        }

        this.playerResponses={}
        
        // Alert the players
        const event={
            "Event":"Start Pick",
            "State":this.state,
            "Responses":{}
        }
        const aIds=Object.keys(this.anonymousResponses)
        for(let i=0;i<aIds.length;i++){
            event.Responses[aIds[i]]=this.anonymousResponses[aIds[i]].cards
        }

        this.eventAll(event)
    }

    start(){
        if(this.state!="lobby"){return false}
        if(Object.keys(this.players).length<3){return false}
        
        this.prompts=new Deck()
        this.responses=new Deck()
        this.promptDiscard=new Deck()
        this.responseDiscard=new Deck()

        for(let i=0;i<this.packs.length;i++){
            const cards=loadDeck(this.packs[i])
            this.prompts.join(cards.prompts)
            this.responses.join(cards.responses)
        }

        if(this.allowPlayerResponses){
            const names=Object.keys(this.names)
            for(let n=0;n<names.length;n++){
                for(let i=0;i<this.allowPlayerResponses;i++)
                {this.responses.add(names[n])}
            }
        }

        if(this.prompts.cards.length==0||this.responses.cards.length==0){
            this.delete()
            return
        }

        if(this.responses.cards.length<(Object.keys(this.names).length*this.handSize)){
            this.ignoreDiscard=true
        }else{
            this.ignoreDiscard=false
        }

        this.prompts.shuffle()
        this.responses.shuffle()
        
        this.turnOrder=Object.keys(this.names)
        for(let i=this.turnOrder.length-1;i>=0;i--){
            const a=this.turnOrder[i]
            const ni=Math.floor(Math.random()*(i+1))
            this.turnOrder[i]=this.turnOrder[ni]
            this.turnOrder[ni]=a
        }

        this.currentPlayer=0
        
        // Deal out cards to players
        for(let n=0;n<this.turnOrder.length;n++){
            for(let i=0;i<this.handSize;i++){
                this.players[this.names[this.turnOrder[n]]]
                    .deck.add(this.drawResponse())
            }
        }

        this.startRespondPhase()
        
        this.eventAll({"Event":"Start"})
        return true
    }

    choice(ID,choices,res){
        if(this.state!="respond"){
            req400(undefined,res)
            return
        }

        if(this.players[ID].name==this.turnOrder[this.currentPlayer]){
            req400(undefined,res)
            return
        }

        if(choices.length!=this.numResponsesForPrompt){
            req400(undefined,res)
            return
        }

        for(let i=0;i<choices.length;i++){
            // Find duplicates
            if(choices.indexOf(choices[i])!=i){
                req400(undefined,res)
                return
            }
            // Find out of bounds
            if(0>choices[i] || choices[i]>=this.handSize){
                req400(undefined,res)
                return
            }
        }

        this.playerResponses[ID]=choices
        
        if(Object.keys(this.playerResponses).length==this.turnOrder.length-1)
            {this.startPickPhase()}

        res.writeHead(200)
        res.end()
    }

    pick(ID,aID,res){
        // The picking phase has started
        if(this.state!="pick"){
            req400(undefined,res)
            return
        }

        // The correct player is choosing
        if(ID!=this.names[this.turnOrder[this.currentPlayer]]){
            req400(undefined,res)
            return
        }

        // The chosen player exists
        if(!(aID in this.anonymousResponses)){
            req400(undefined,res)
            return
        }
        const name=this.anonymousResponses[aID].name

        // Increment the counter for the winner
        this.players[this.names[name]].points++

        // De-anonymize the scores
        const deAnonymized=[]
        {
            const keys=Object.keys(this.anonymousResponses)
            for(let i=0;i<keys.length;i++){
                deAnonymized.push({
                    name:this.anonymousResponses[keys[i]].name,
                    cards:this.anonymousResponses[keys[i]].cards,
                    points:this.players[this.names[this.anonymousResponses[keys[i]].name]].points
                })
            }
        }
        deAnonymized.sort((a,b)=>{
            return b.points-a.points
        })

        // Alert the players of the round win
        const event={
            "Event":"Round Win",
            "Player":name,
            "Points":{},
            "RoundPrompt":this.prompt,
            "PlayerResponses":deAnonymized
        }
        for(let i=0;i<this.turnOrder.length;i++){
            event.Points[this.turnOrder[i]]=this.players[this.names[this.turnOrder[i]]].points
        }
        this.eventAll(event)

        // Check for wins
        if(this.players[this.names[name]].points>=this.points){
            this.state="win"

            const event={
                "Event":"Win",
                "Points":{},
                "State":this.state
            }
            for(let i=0;i<this.turnOrder.length;i++){
                event.Points[this.turnOrder[i]]=this.players[this.names[this.turnOrder[i]]].points
            }
            this.eventAll(event)
            setTimeout(()=>{this.delete()},Game.#gameTimeout)
            return
        }

        // Move to the next player
        if(this.classicTurns){
            this.currentPlayer=this.turnOrder.indexOf(name)
        }else{
            this.currentPlayer++
            if(this.currentPlayer>=this.turnOrder.length){
                this.currentPlayer=0
            }
        }

        // Next phase
        this.startRespondPhase()

        // close the connection
        res.writeHead(200)
        res.end()
    }

    addPlayer(name){
        name=name
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")

        if(this.state!="lobby"){return [0,"Game already started!"]}

        if(name in this.names){return [1,"Name already exists!"]}

        let ID=Game.#generatePlayerId()
        while(ID in this.players)
            {ID=Game.#generatePlayerId()}

        this.names[name]=ID
        this.players[ID]={
            "deck":new Deck(),
            "listeners":[],
            "missedEvents":[],
            "name":name,
            "timeout":undefined,
            "points":0
        }

        this.eventAll({
            "Event":"Join",
            "Name":name
        })

        return ID
    }

    removePlayer(name){
        if(!(name in this.names)){return}
        
        this.event({"Event":"Kick"},this.names[name])
        this.eventAll({"Event":"Disconnect","Name":name})

        delete this.players[this.names[name]]
        delete this.names[name]

        if(this.state!="lobby"&&Object.keys(this.names).length<3){
            this.delete()
        }
    }

    getStatus(ID,res){
        const stats={
            "Event":"Full Status",
            "GameID":this.id,
            "State":this.state,
            "Players":Object.keys(this.names),
            "Settings":{
                "allowPlayerDecks":this.allowPlayerDecks,
                "playerNameResponses":this.allowPlayerResponses,
                "classicTurns":this.classicTurns
            }
        }

        if(ID in this.players){
            stats.Name=this.players[ID].name
        }

        if(this.state!="lobby"){
            stats.Turn=this.turnOrder[this.currentPlayer]
            stats.Points={}
            for(let i=0;i<this.turnOrder.length;i++){
                stats.Points[this.turnOrder[i]]=this.players[this.names[this.turnOrder[i]]].points
            }
            stats.Prompt=this.prompt
            stats.NumResponses=this.numResponsesForPrompt
            if(ID in this.players){
                stats.Cards=this.players[ID].deck.cards
            }
        }

        if(this.state=="pick"){
            stats.Responses={}
            const aIds=Object.keys(this.anonymousResponses)
            for(let i=0;i<aIds.length;i++){
                stats.Responses[aIds[i]]=this.anonymousResponses[aIds[i]].cards
            }
        }

        try{
            res.writeHead(200,{"Content-Type":"application/json"})
            res.write(JSON.stringify(stats))
            res.end()
        }catch{Log("Unable to send game status!")}
    }

    pollReq(ID,res){
        if(this.players[ID].missedEvents.length!=0){
            res.writeHead(200,{"Content-Type":"application/json"})
            res.write(JSON.stringify(this.players[ID].missedEvents.shift()))
            res.end()
        }else{
            this.players[ID].listeners.push(res)
        }
        setTimeout(()=>{
            if(!res.finished){
                try{
                    res.writeHead(200,{"Content-Type":"application/json"})
                    res.write(`{"Event":"Resend"}`)
                    res.end()
                    this.players[ID].listeners.splice(
                        this.players[ID].listeners.indexOf(res),1)
                }catch{}
            }
        },10000)

        clearTimeout(this.deleteTimer)
        this.deleteTimer=setTimeout(()=>{
            this.timeoutFunc()},Game.#gameTimeout)

        clearTimeout(this.players[ID].timeout)
        this.players[ID].timeout=setTimeout((ID)=>{
            this.playerTimeoutFunc(ID)},Game.#playerTimeout,ID)
    }

    event(event,ID){
        const p=this.players[ID]

        let sent=false
        for(let l=0;l<p.listeners.length;l++){
            const r=p.listeners[l]
            try{
                if(r.finished){continue}
                if(r.closed){continue}
                if(!r.writeable){continue}
                r.writeHead(200,{"Content-Type":"application/json"})
                r.write(JSON.stringify(event))
                r.end()
                sent=true
            }catch{}
        }

        if(!sent){
            p.missedEvents.push(event)
        }

    }

    eventAll(event){
        const pKeys=Object.keys(this.players)
        for(let i=0;i<pKeys.length;i++){
            const p=this.players[pKeys[i]]
            let sent=false
            for(let l=0;l<p.listeners.length;l++){
                const r=p.listeners[l]
                try{
                    if(r.finished){continue}
                    if(r.closed){continue}
                    if(r.writeable==false){continue}
                    r.writeHead(200,{"Content-Type":"application/json"})
                    r.write(JSON.stringify(event))
                    r.end()
                    sent=true
                }catch{}
            }

            if(!sent){
                p.missedEvents.push(event)
                continue
            }
        }
    }

    timeoutFunc(){
        let hasConnections=false
        const pKeys=Object.keys(this.players)
        for(let i=0;i<pKeys.length;i++){
            if(this.players[pKeys[i]].listeners.length>0)
                {hasConnections=true;break}
        }
        
        if(!hasConnections){
            this.delete()
        }else{
            this.deleteTimer=setTimeout(()=>{
                this.timeoutFunc()},Game.#gameTimeout)
        }
    }

    playerTimeoutFunc(ID){
        if(!(ID in this.players)){return}

        if(ID==this.ownerID){
            this.delete()
        }else{
            this.removePlayer(this.players[ID].name)
        }
    }

    delete(){
        this.eventAll({"Event":"End"})
        delete this.gamesList[this.id]
    }
};exports.Game=Game