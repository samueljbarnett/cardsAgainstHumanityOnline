class Deck{
    constructor(cards=[]){
        if(!Array.isArray(cards))
            {throw `"cards" parameter of Deck constructor must be an Array! Received type "${typeof cards}"`}
        this.cards=cards
    }

    shuffle(){
        for(let i=this.cards.length-1;i>=0;i--){
            const a=this.cards[i]
            const ni=Math.floor(Math.random()*(i+1))
            this.cards[i]=this.cards[ni]
            this.cards[ni]=a
        }
    }

    draw(){
        return this.cards.pop()
    }

    add(card){
        this.cards.push(card)
    }

    join(deck){
        if(!Deck.prototype.isPrototypeOf(deck))
            {throw `"deck" parameter of Deck.join must be of type Deck!`}

        let c=deck.draw()
        while(c!=undefined){
            this.add(c)
            c=deck.draw()
        }
    }

    pick(n){
        if(isNaN(n)){throw `"n" parameter of pick function must be a number!`}
        if(n<0||n>=this.cards.length){return undefined}

        return this.cards.splice(n,1)[0]
    }
}exports.Deck=Deck