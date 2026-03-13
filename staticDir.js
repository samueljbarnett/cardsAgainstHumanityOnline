/**
 * A class for caching and watching a directory
 * @module StaticDirectory
 * @author 4MMWJ
 * @version 1.0.2
*/
/** Changes:
 * Added option to uri encode file paths
 */


const fs=require('fs')

/**
 * Caches and watches a directory
 * @class
 */
class StaticDirectory{
    #path=''
    #files={}
    #encode=false
    #prefix=RegExp("^","i")
    /**
     * Creates a Static directory
     * @constructs StaticDirectory
     * @param {string} path Path of the directory to cache
     * @param {string} prefix Prefix removed from getFile path before searching
     * @param {boolean} encode Toggle if the file paths should be uri encoded
     */
    constructor(path,prefix="",encode=false){
        this.#path=path
        this.#prefix=RegExp("^"+prefix,"i")
        this.#encode=encode
        this.watch(path)
        this.#files=StaticDirectory.readDirectory(this.#path,this.#encode)
    }
    /**
     * Watches a directory and all sub directories. DO NOT call directly. This
     * is automatically done on the construction of the object.
     * @param {string} p The path to watch
     */
    watch(p){
        fs.watch(p,()=>{this.#files=StaticDirectory.readDirectory(this.#path,this.#encode)})
        const dir=fs.readdirSync(p)
        for(let i=0;i<dir.length;i++){
            const fp=p+'/'+dir[i]
            if(fs.lstatSync(fp).isDirectory())
            {this.watch(fp)}
        }
    }
    /**
     * Reads a directory and all sub directories
     * @param {string} p The path to read
     * @param {boolean} enc Toggle if the file paths should be uri encoded
     */
    static readDirectory(p,enc=false){
        let dirFs={}
        const dir=fs.readdirSync(p)
        for(let i=0;i<dir.length;i++){
            const fp=p+'/'+dir[i]
            if(fs.lstatSync(fp).isDirectory())
            {dirFs[enc?encodeURIComponent(dir[i]):dir[i]]=
                StaticDirectory.readDirectory(fp,enc)}
            else{dirFs[enc?encodeURIComponent(dir[i]):dir[i]]=
                fs.readFileSync(fp)}
        };return dirFs
    }
    /**
     * Read a file
     * @param {string} path The path of a file to read
     * @returns {Buffer|undefined} The file as a buffer or undefined if it does not exist
     */
    getFile(path){
        let s=path
            .replace(this.#prefix,'')
            .split('/')
        let d=this.#files
    try{
        for(let i=1;i<s.length;i++){
            d=d[s[i]]
            if(typeof d!='object'){return}
            if(d instanceof Buffer && i==s.length-1){return d}
            if(d instanceof Buffer && i!=s.length-1){return}
        }
    }catch{return}
    }
};exports.StaticDirectory=StaticDirectory