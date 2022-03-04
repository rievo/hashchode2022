var fs = require('fs');
var main = require("./main.js");

function loadFile(url, cb){
    fs.readFile(url, 'utf8', (err, data) => {
        if (err) throw err;
        cb(data)
    })
}

// let files = ["a", "b", "c", "d", "e", "f"]
let files = ["a"]

files.forEach(f => {
    console.log("========= FILE "+f+" ==========")
    loadFile('./data/'+f+".txt", (data) =>{
        let solution = main.processFile(data);

        fs.writeFile('solutions/'+f+".txt", solution, err => {
            if (err) {
              console.error(err)
              return
            }
          })
    });
    
})