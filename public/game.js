let playerName
let turn
let cards=[]
let chosenCards={}
let prompt
let numResponses
let state
let chosenWinner
let points
let lead

const cardListElement=document.getElementById("cardList")
const responseListElement=document.getElementById("responseList")
const makeChoiceButton=document.getElementById("makeChoiceButton")
const promptElement=document.getElementById("prompt")
const pointsOut=document.getElementById("pointsOut")
const roundScoreOut=document.getElementById("roundScoreOut")
const roundWinnerName=document.getElementById("roundWinnerName")
const roundScore=document.getElementById("roundScore")

function receivedStatus(e){
    if(e.target.status!=200)
        {document.location.assign("/");return}
    
    const res=JSON.parse(e.target.response)
    switch(res.Event){
        case "Full Status":{
            playerName=res.Name

            console.log(res)
            break;
        }

        case "Disconnect":
            if(res.Name==playerName){
                document.location.assign("/")
                return
            }

            console.log(`${res.Name} has disconnected!`)
            break;
        
        case "Round Win":{
            console.log(res.PlayerResponses)
            roundWinnerName.textContent=res.Player

            while(roundScoreOut.childElementCount>0)
                {roundScoreOut.removeChild(roundScoreOut.children[0])}

            for(let i=0;i<res.PlayerResponses.length;i++){
                const l=document.createElement("li")
                if(res.PlayerResponses[i].name==res.Player)
                    {l.classList.add("winner")}
                l.innerHTML=`${res.PlayerResponses[i].points} - ${res.PlayerResponses[i].name}: ${generatePromptHtml(res.RoundPrompt,res.PlayerResponses[i].cards,true)}`
                roundScoreOut.appendChild(l)
            }

            roundScore.hidden=false
            roundScore.ariaHidden=false
            setTimeout(()=>{
                roundScore.hidden=true
                roundScore.ariaHidden=true
            },5000)
            }break;

        case "End":
        case "Kick":
            document.location.assign("/")
            return;

        case "Resend":
            break;

        default:
            console.log(res)
    }

    if("Turn" in res){
        turn=res.Turn
    }
    if("NumResponses" in res){
        numResponses=res.NumResponses
    }
    if("Prompt" in res){
        chosenCards={}
        prompt=res.Prompt
        showPrompt()
    }
    if("Cards" in res){
        chosenCards={}
        cards=res.Cards
        showPrompt()

        while(cardListElement.childElementCount>0){
            cardListElement.removeChild(cardListElement.children[0])
        }

        for(let i=0;i<cards.length;i++){
            const e=document.createElement("li")
            const b=document.createElement("button")
            e.id=`card-${i}`
            b.textContent=cards[i]
            b.choiceID=i
            b.onclick=addChoice
            e.appendChild(b)
            cardListElement.appendChild(e)
        }
    }

    if("Responses" in res){
        chosenWinner=undefined

        while(responseListElement.childElementCount>0){
            responseListElement.removeChild(responseListElement.children[0])
        }

        const keys=Object.keys(res.Responses)
        for(let i=0;i<keys.length;i++){
            const e=document.createElement("li")
            const b=document.createElement("button")
            
            b.innerHTML=generatePromptHtml(prompt,res.Responses[keys[i]],true)
            b.choiceID=keys[i]
            b.onclick=chooseWinner

            e.appendChild(b)
            responseListElement.appendChild(e)
        }
    }

    if("Points" in res){
        points=res.Points
        const keys=Object.keys(points)
        lead=''
        leadPoints=0
        for(let i=0;i<keys.length;i++){
            if(points[keys[i]]>leadPoints){
                leadPoints=points[keys[i]]
                lead=keys[i]
            }
        }
        console.log(res)
    }

    if("State" in res){
        state=res.State

        switch(state){
            case "pick":
                responseList.hidden=false
                cardListElement.hidden=true
                if(turn!=playerName){
                    makeChoiceButton.hidden=true
                }else{
                    makeChoiceButton.hidden=false
                }
                break;
            case "respond":
                responseList.hidden=true
                if(turn!=playerName){
                    cardListElement.hidden=false
                    makeChoiceButton.hidden=false
                }else{
                    cardListElement.hidden=true
                    makeChoiceButton.hidden=true
                }
                break;
            case "win":{
                promptElement.hidden=true
                responseList.hidden=true
                cardListElement.hidden=true
                makeChoiceButton.hidden=true
                document.getElementById("winDialogue").hidden=false
                const winNames=document.getElementsByClassName("winnerName")
                for(let i=0;i<winNames.length;i++){
                    winNames[i].textContent=lead
                }
                const pointList=[]
                const pointsNames=Object.keys(points)
                for(let i=0;i<pointsNames.length;i++){
                    pointList.push([pointsNames[i],points[pointsNames[i]]])
                }
                pointList.sort((a,b)=>{
                    return b[1]-a[1]
                })
                for(let i=0;i<pointList.length;i++){
                    const e=document.createElement("li")
                    e.innerHTML=`<span>${pointList[i][0]}:</span><span>${pointList[i][1]}</span>`
                    pointsOut.appendChild(e)
                }
                break
            }default:
                alert("Unknown game state!")
        }
    }

    pollStatus()
}

function pick(p){
    const statusPoll=new XMLHttpRequest()
    statusPoll.open("GET",`/api/pick?player=${p}`)
    statusPoll.send()
}

function generatePromptHtml(prompt,responses,nonFunctional=false){
    const punctuation=[".","!","?"]
    const capitalizeAfter=[".","!","?",":"]

    let html=prompt
    let i=0
    while(html.includes("_")){
        let choiceText=(responses[i]!=undefined)?responses[i]:""
        const blankIndex=html.indexOf("_")
        if(choiceText.length>0){
            // Capitalize if the first character
            if(blankIndex==0){
                choiceText=choiceText[0].toUpperCase()+choiceText.slice(1)
            }
            // Capitalize if new sentence or line
            for(let i=blankIndex-1;i>0;i--){
                if(html[i]==" "){continue}
                if(capitalizeAfter.includes(html[i]) || html[i]=="\n" || (html[i]=="n"&&html[i-1]=="\\")){
                    choiceText=choiceText[0].toUpperCase()+choiceText.slice(1)
                }
                break
            }
        }

        let choiceHtml
        if(nonFunctional){
            choiceHtml=(choiceText!="")?`${choiceText}`:""
        }else{
            choiceHtml=(choiceText!="")?`<button onclick="removeChoice(${i})">${choiceText}</button>`:""
        }
        html=html.replace("_",`<span id="blank-${i}" class="blank">${choiceHtml}</span>`)
        i++
    }

    html=html.replaceAll("\n","<br>")
    html=html.replaceAll("\\n","<br>")

    // Punctuation
    let isResponse=false
    if(html.match(/[^\>]\<\/button\>\<\/span\>$/)!=null){
        html=html.slice(0,html.length-16)
        isResponse=true
    }
    let isQuote=false
    if(html[html.length-1]=='"'){
        html=html.slice(0,html.length-1)
        isQuote=true
    }
    if(!punctuation.includes(html[html.length-1])){
        html+="."
    }
    if(isQuote){
        html+='"'
    }
    if(isResponse){
        html+='</button></span>'
    }
    return html
}
function showPrompt(){
    const choicesList=[]
    for(let i=0;i<numResponses;i++){
        if(!(i in chosenCards)){
            choicesList.push(undefined)
            continue
        }
        choicesList.push(cards[chosenCards[i]])
    }
    promptElement.innerHTML=generatePromptHtml(prompt,choicesList)
}

function addChoice(e){
    const choice=e.srcElement.choiceID
    let filled=false
    for(let i=0;i<numResponses;i++){
        if(i in chosenCards){continue}
        chosenCards[i]=choice
        filled=true
        break
    }
    document.getElementById(`card-${choice}`).hidden=true

    if(!filled){
        removeChoice(numResponses-1)
        chosenCards[numResponses-1]=choice
    }
    showPrompt()
}
function removeChoice(i){
    document.getElementById(`card-${chosenCards[i]}`).hidden=false
    delete chosenCards[i]
    document.getElementById(`blank-${i}`)
    showPrompt()
}

function choose(choices){
    let c=choices[0]
    for(let i=1;i<choices.length;i++)
        {c+=","+choices[i]}
    
    const statusPoll=new XMLHttpRequest()
    statusPoll.open("GET",`/api/choose?cards=${c}`)
    statusPoll.send()
}

function pollStatus(full=false){
    const statusPoll=new XMLHttpRequest()
    statusPoll.open("GET",(full)?"/api/lobbyStatus":"/api/pollLobbyStatus")
    statusPoll.onload=receivedStatus
    statusPoll.send()
}

pollStatus(full=true)

function makeChoice(){
    if(state=="respond"){
        const keys=Object.keys(chosenCards)
        if(keys.length!=numResponses){
            alert(`You must choose ${numResponses} card${(numResponses==1)?"":"s"}.`)
            return
        }
    
        const choices=[]
        for(let i=0;i<numResponses;i++){
            choices.push(chosenCards[i])
        }
    
        choose(choices)
    }else if(state=="pick"){
        if(chosenWinner==undefined){
            alert(`You must pick a winner.`)
            return
        }

        pick(chosenWinner)
    }
}

function chooseWinner(e){
    if(turn!=playerName){return}

    const c=document.getElementsByClassName("chosen")
    for(let i=0;i<c.length;i++){
        c[i].classList.remove("chosen")
    }

    let target=e.srcElement

    if(target.choiceID==undefined){
        target=target.parentElement
    }
    if(target.choiceID==undefined){
        return
    }
    
    chosenWinner=target.choiceID
    target.classList.add("chosen")
}