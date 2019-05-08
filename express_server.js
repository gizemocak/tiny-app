var express = require('express');
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

function generateRandomString() {
    return (Math.floor(Math.random() * 1000000)).toString()
}

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
}));

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
}

app.get('/', (req, res) => {
    //console.log(JSON.stringify(req))
    res.send('Hello');

})

app.get('/uls.json', (req, res) => {
    res.json(urlDatabase)
})

app.get("/urls", (req, res) => {
    let templateVars = {
        urls: urlDatabase
    };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
    console.log(req.params.shortURL, JSON.stringify(urlDatabase))
    let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL]
    };
    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    res.redirect(`${urlDatabase[req.params.shortURL]}`)
});
//add functionality to delete button
app.post("/urls/:shortURL/delete", (req, res) => {
    const short = req.params.shortURL
    delete urlDatabase[short]
    res.redirect("/urls")
})

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post('/urls', (req, res) => {
    const random = generateRandomString()
    urlDatabase[random] = req.body.longURL
    res.status(301).redirect(`/urls/${random}`)
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`)
})