const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(
    cookieSession({
        name: "session",
        keys: ["key1", "key2"]
    })
);

app.set("view engine", "ejs");

const urlDatabase = {
    b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW"
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
    },
    12345: {
        longURL: "aaaa@b.c",
        userID: "a"
    }
};

const users = {
    "774106": {
        id: "774106",
        email: "a@b.com",
        password: "$2b$10$h.DI10898.Ufo6bejdoymuVj6LS/bBPP6.q0PtUB/kENpd4rxKohK"
    }
};

///---Helper Functions---///
const generateRandomString = () => {
    return Math.random().toString(36).substring(7);
};

const getUserFromEmail = email => {
    const array = Object.values(users);
    return array.find(item => item.email === email);
};

/* given a userIDCookie find the corresponding user and longURL in the user DB */
const getUserURLS = userIDCookie =>
    Object.keys(urlDatabase).reduce((acc, key) => {
        if (urlDatabase[key].userID === userIDCookie) {
            acc[key] = {
                longURL: urlDatabase[key].longURL,
                userID: urlDatabase[key].userID
            };
        }
        return acc;
    }, {});

///-------URLs------///
app.get("/", (req, res) => {
    if (req.session.user_id) {
        res.redirect("/urls");
    } else {
        res.redirect("/login");
    }
});

app.get("/urls", (req, res) => {
    const templateVars = {
        urls: getUserURLS(req.session.user_id),
        user: users[req.session.user_id]
    };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    if (!users[req.session.user_id]) {
        res.redirect("/login");
    }
    const templateVars = {
        user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    if (req.session.user_id) {
        /* if short url id is not in database show error*/
        if (!urlDatabase[req.params.shortURL]) {
            res.status(404).render("urls_error", {
                user: users[req.session.user_id],
                error_message: "Given ID does not exist!"
            });
        }
        const userURLS = getUserURLS(req.session.user_id);
        const templateVars = {
            shortURL: req.params.shortURL,
            longURL: urlDatabase[req.params.shortURL].longURL,
            user: users[req.session.user_id],
            urlIsUsers: !!userURLS[req.params.shortURL]
        };
        res.render("urls_show", templateVars);
    } else {
        res.status(401).render("urls_error", {
            user: null,
            error_message: "Login to view short url!"
        });
    }
});

app.get("/u/:shortURL", (req, res) => {
    const urlForId =
        urlDatabase[req.params.shortURL] ?
        urlDatabase[req.params.shortURL].longURL : null;

    if (urlForId) {
        res.redirect(`${urlDatabase[req.params.shortURL].longURL}`);
    } else {
        res.status(404).render("urls_error", {
            user: null,
            error_message: "Given ID does not exist!"
        });
    }
});

app.post("/urls", (req, res) => {
    if (req.session.user_id) {
        const random = generateRandomString();
        urlDatabase[random] = {
            longURL: req.body.longURL,
            userID: req.session.user_id
        };
        res.status(301).redirect(`/urls/${random}`);
    } else {
        res.status(401).render("urls_error", {
            user: null,
            error_message: "Login to create a short url!"
        });
    }
});

app.post("/urls/:shortURL", (req, res) => {
    const short = req.params.shortURL;
    if (req.session.user_id) {
        if (req.session.user_id === urlDatabase[short].userID) {
            urlDatabase[short].longURL = req.body.longURL;
            res.redirect("/urls");
        } else {
            res.status(403).render("urls_error", {
                user: users[req.session.user_id],
                error_message: "You have no permission to update that url"
            });
        }
    } else {
        res.status(401).render("urls_error", {
            user: null,
            error_message: "Login to update a short url!"
        });
    }

});

app.post("/urls/:shortURL/delete", (req, res) => {
    const short = req.params.shortURL;
    if (!req.session.user_id) {
        res.status(401).render("urls_error", {
            user: null,
            error_message: "You need to be logged in to delete URLs."
        });
    } else if (req.session.user_id === urlDatabase[short].userID) {
        delete urlDatabase[short];
        res.redirect("/urls");
    } else if (req.session.user_id !== urlDatabase[short].userID) {
        delete urlDatabase[short];
        res.status(403).render("urls_error", {
            user: users[req.session.user_id],
            error_message: "You need to own the URL to delete it."
        });
    }
});

//Authentication Routes

app.get("/login", (req, res) => {
    /* check that user is logged in and that it exists in database in case 
    that an old cookie remains for a non existing user */
    if (req.session.user_id && users[req.session.user_id]) {
        res.redirect("/urls");
    } else {
        const templateVars = {
            user: users[req.session.user_id]
        };
        res.render("urls_login.ejs", templateVars);
    }
});


app.get("/register", (req, res) => {
    /* check that user is logged in and that it exists in database in case 
    that an old cookie remains for a non existing user */
    if (req.session.user_id && users[req.session.user_id]) {
        res.redirect("/urls");
    } else {
        const templateVars = {
            user: users[req.session.user_id]
        };
        res.render("urls_registration", templateVars);
    }
});

app.post("/login", (req, res) => {
    const user = getUserFromEmail(req.body.email);
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
        req.session.user_id = user.id;
        res.redirect("/urls");
    } else {
        res.status(403).render("urls_error", {
            user: null,
            error_message: "Credentials are incorrect."
        });
    }
});

app.post("/register", (req, res) => {
    const randomId = generateRandomString();
    const email = req.body.email;
    if (email.length === 0 || req.body.password.length === 0) {
        res.status(400).render("urls_error", {
            user: null,
            error_message: "Email or password are empty."
        });
    } else if (typeof getUserFromEmail(email) === "undefined") {
        /* register user if email is not already being used */
        const password = bcrypt.hashSync(req.body.password, 10);
        users[randomId] = {
            id: randomId,
            email: email,
            password: password
        };
        req.session.user_id = randomId;
        res.redirect("/urls");
    } else {
        res.status(409).render("urls_error", {
            user: null,
            error_message: "Email already exists."
        });
    }
});

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/urls");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});