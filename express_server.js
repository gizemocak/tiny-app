var express = require('express');
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(cookieParser())

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
        urls: urlDatabase,
        username: req.cookies["username"]
    };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = {
        username: req.cookies["username"],
    };
    res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    console.log(req.params.shortURL, JSON.stringify(urlDatabase))
    let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL],
        username: req.cookies["username"]
    };
    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    res.redirect(`${urlDatabase[req.params.shortURL]}`)
});
//add delete functionality to button
app.post("/urls/:shortURL/delete", (req, res) => {
    const short = req.params.shortURL
    delete urlDatabase[short]
    let templateVars = {
        username: req.cookies["username"],
    };
    res.redirect("/urls", templateVars)
})

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post('/urls', (req, res) => {
    const random = generateRandomString()
    urlDatabase[random] = req.body.longURL
    res.status(301).redirect(`/urls/${random}`)
})
//Edit LongURL
app.post('/urls/:shortURL', (req, res) => {
    const short = req.params.shortURL
    urlDatabase[short] = req.body.longURL
    res.redirect('/urls')
})

//The login route
app.post('/login', (req, res) => {
    res.cookie('username', req.body.username)
    res.redirect('/urls')
})

//The logout route
app.post('/logout', (req, res) => {
    res.clearCookie('username')
    res.redirect('/urls')
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`)
})