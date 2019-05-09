const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(cookieParser())
app.set("view engine", "ejs");

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
}

const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "a@b.c",
        password: "a"
    },
    "69643": {
        id: "69643",
        email: "aaaa@b.c",
        password: "a"
    }
}


const generateRandomString = () => {
    return (Math.floor(Math.random() * 1000000)).toString()
}

const checkEmail = (email) => {
    const array = Object.values(users)
    return array.find(item => item.email === email)
}

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    //console.log(JSON.stringify(req))
    res.send('Hello');

})

app.get('/uls.json', (req, res) => {
    res.json(urlDatabase)
})

app.get("/urls", (req, res) => {
    // TODO pass user object to template so that header can render user email
    // find user object using id cookie

    console.log(req.cookies);

    let templateVars = {
        urls: urlDatabase,
        user: users[req.cookies["user_id"]]
    };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = {
        user: users[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    //console.log(req.params.shortURL, JSON.stringify(urlDatabase))
    let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL],
        user: users[req.cookies["user_id"]]
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
    // let templateVars = {
    //     username: req.cookies["username"],
    // };
    res.redirect("/urls")
})

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
    const templateVars = {
        user: users[req.cookies["user_id"]]
    }
    res.render("urls_registration", templateVars)
})

app.get("/login", (req, res) => {
    let templateVars = {
        user: users[req.cookies.user_id]
    }
    res.render("urls_login.ejs", templateVars)
})

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
    let user = checkEmail(req.body.email)
    if (!user) {
        res.status(403).end()
    } else if (user.password === req.body.password) {
        res.cookie('user_id', user.id)
        res.redirect('/urls')
    } else {
        res.status(403).end()
    }

})

//The logout route
app.post('/logout', (req, res) => {
    res.clearCookie('user_id')
    res.redirect('/urls')
})

app.post('/register', (req, res) => {
    console.log(req.body);

    const randomId = generateRandomString()
    const {
        email,
        password
    } = req.body

    if (email.length === 0 || password.length === 0) {
        res.sendStatus(400)
    } else if (typeof checkEmail(email) === 'undefined') {
        users[randomId] = {
            id: randomId,
            email: email,
            password: password
        }
        res.cookie('user_id', randomId)
        res.redirect('/urls')
    } else {
        res.sendStatus(400)
    }


})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`)
})