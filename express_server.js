const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
var cookieSession = require("cookie-session");

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
    email: "gizem_ocak@outlook.com",
    password: "$2b$10$h.DI10898.Ufo6bejdoymuVj6LS/bBPP6.q0PtUB/kENpd4rxKohK"
  }
};

const generateRandomString = () => {
  return Math.floor(Math.random() * 1000000).toString();
}; ///

const checkEmail = email => {
  const array = Object.values(users);
  return array.find(item => item.email === email);
};

const urlsForUser = userIDCookie =>
  Object.keys(urlDatabase).reduce((acc, key) => {
    if (urlDatabase[key].userID === userIDCookie) {
      acc[key] = {
        longURL: urlDatabase[key].longURL,
        userID: urlDatabase[key].userID
      };
    }
    return acc;
  }, {});

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/uls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  }
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id) {
    const userURLS = urlsForUser(req.session.user_id);
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.user_id],
      urlIsUsers: !!userURLS[req.params.shortURL]
    };
    res.render("urls_show", templateVars);
  } else {
    res.render("urls_error", {
      error_message: "need to be logged in to create short url"
    });
  }
});

app.get("/u/:shortURL", (req, res) => {
  const urlForId =
    urlDatabase[req.params.shortURL] &&
    urlDatabase[req.params.shortURL].longURL;

  if (urlForId) {
    res.redirect(`${urlDatabase[req.params.shortURL].longURL}`);
  } else {
    res.render("urls_error", {
      error_message: "that ID does not exist"
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
    res.render("urls_error", {
      error_message: "need to be logged in to create short url"
    });
  }
});

//Edit LongURL
app.post("/urls/:shortURL", (req, res) => {
  const short = req.params.shortURL;
  if (req.session.user_id === urlDatabase[short].userID) {
    urlDatabase[short].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.sendStatus(400);
  }
});

//add delete functionality to button
app.post("/urls/:shortURL/delete", (req, res) => {
  const short = req.params.shortURL;
  if (req.session.user_id === urlDatabase[short].userID) {
    delete urlDatabase[short];
    res.redirect("/urls");
  } else {
    res.sendStatus(400);
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_login.ejs", templateVars);
  }
});

//The login route
app.post("/login", (req, res) => {
  let user = checkEmail(req.body.email);
  if (!user) {
    res.status(403).render("urls_error", {
      error_message: "that user does not exist"
    });
  } else if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).render("urls_error", {
      error_message: "credentials are incorrect"
    });
  }
});

//The logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const randomId = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);

  if (email.length === 0 || password.length === 0) {
    res.sendStatus(400);
  } else if (typeof checkEmail(email) === "undefined") {
    users[randomId] = {
      id: randomId,
      email: email,
      password: password
    };
    req.session.user_id = randomId;
    res.redirect("/urls");
  } else {
    res.sendStatus(400);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
