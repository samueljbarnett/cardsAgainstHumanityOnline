/**
 * A function for parsing a configuration file
 * @function parseConf
 * @author 4MMWJ
 * @version 1.0.0
 * 
 * @todo Ignore comments
 * @todo Toggle to allow undefined config options
 * @todo Min and maximum values in int and float/number
 */

const fs=require("fs")

/**
 * Parse a configuration file
 * @param {string} path File path
 * @param {object} def Configuration definition
 * @returns {object} Parsed configuration
 */
function parseConf(path,def={}){
    const configuration={}

    let file
    if(fs.existsSync(path)){
        file=fs.readFileSync(path,{encoding:"utf-8"})
    }else{ file="" }
    const lines=file.split("\n")

    for(let l=0;l<lines.length;l++){
        const split=lines[l].split("=")
        const key=split.shift()
        const val=split.join("=")

        if(key==""){continue}

        configuration[key]=val
    }

    for(key in def){
        if(!(key in configuration)){
            if("default" in def[key]){
                configuration[key]=def[key]["default"]
            } else if("required" in def[key] && def[key]["required"]){
                throw `configuration parser: No key found for required variable "${key}"`
            }
        }else{
            if("type" in def[key]){
                switch(def[key]["type"]){
                    case "int":{
                        let n=Number(configuration[key])
                        if(isNaN(n))
                            {throw `configuration parser: Unable to parse "${configuration[key]}" as int in ${key}`}
                        if(n!=Math.floor(n))
                            {throw `configuration parser: ${configuration[key]} is not an int in ${key}`}
                        configuration[key]=n
                        break}
                    case "float":
                    case "number":{
                        let n=Number(configuration[key])
                        if(isNaN(n))
                            {throw `configuration parser: Unable to parse "${configuration[key]}" as number in ${key}`}
                        configuration[key]=n
                        break}
                    case "string":
                        break
                    default:
                        console.warn(`configuration parser: Unknown type "${def[key]["type"]}"`)
                }
            }
        }
    }

    return configuration
}
exports.parseConf=parseConf