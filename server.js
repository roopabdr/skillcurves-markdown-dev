if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const mongoose = require('mongoose');
const Article = require('./models/article');
const User = require('./models/user');
const Quote = require('./models/quote');
const Testimonial = require('./models/testimonial');
const articleRouter = require('./routes/articles');
const quoteRouter = require('./routes/quotes');
const testimonialRouter = require('./routes/testimonials');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const nodemailer = require('nodemailer');

const cors = require('cors');

const users = [];
async function initUsers(req, res, next) {
    if (req.body !== null) {
        const oneUser = await User.findOne({ email: req.body.email });
        if (oneUser == null) {
            users.push({
                id: '',
                email: '',
                password: ''
            });
            console.log('oneUser is null ', oneUser, users);
        } else {
            await users.push(oneUser);
        }
    }
    next();
};

const initializePassport = require('./passport-config');
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

const app = express();

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

app.set('view engine', 'ejs'); // used to create HTML views automatically using EJS view engine

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cors());
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// serves images
app.use(express.static('public'));
app.use("/images", express.static("/images"));


const transport = {
    service: 'Godaddy',
    host: "smtpout.secureserver.net",
    secureConnection: false,
    port: 465,
    logger: true,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
};

const transporter = nodemailer.createTransport(transport);

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take messages');
    }
});

app.get('/', checkAuthenticated, async (req, res) => {
    const articles = await Article.find().sort({
        createdAt: 'desc'
    });

    res.render('articles/index', { articles: articles, name: req.user.name });
});

app.get('/blogarticles', async (req, res) => {
    let titlesOnly = req.query.titlesOnly;
    let articleName = req.query.articleName;

    let articles = await Article.find({published: 'on'}).sort({
        createdAt: 'desc'        
    });

    if(titlesOnly==="Y") {
        articles = articles.map(article => {
            return {
                title: article.title
                ,authorName: article.authorName
                ,description: article.description
                ,slug: article.slug
                ,createdAt: new Date(article.createdAt).toLocaleDateString()
            }
        })
    }
    if(articleName !== undefined && articleName !== null) {
        articles = articles.filter(article => {
            return article.slug===articleName
        })
    }

    res.send({ articles: articles});
});

app.get('/quotes', checkAuthenticated, async (req, res) => {
    const quotes = await Quote.find().sort({
        createdAt: 'desc'
    });

    res.render('quotes/quotes_index', { quotes: quotes, name: req.user.name });
});

app.get('/blogquotes', async (req, res) => {
    let titlesOnly = req.query.titlesOnly;
    let quoteName = req.query.quoteName;

    let quotes = await Quote.find({published: 'on'}).sort({
        createdAt: 'desc'        
    });

    if(titlesOnly==="Y") {
        quotes = quotes.map(quote => {
            return {
                title: quote.title
                ,authorName: quote.authorName
                ,slug: quote.slug
                ,createdAt: new Date(quote.createdAt).toLocaleDateString()
            }
        })
    }
    if(quoteName !== undefined && quoteName !== null) {
        quotes = quotes.filter(quote => {
            return quote.slug===quoteName
        })
    }

    res.send({ quotes: quotes});
});

app.get('/testimonials', checkAuthenticated, async (req, res) => {
    const testimonials = await Testimonial.find().sort({
        createdAt: 'desc'
    });

    res.render('testimonials/testimonial_index', { testimonials: testimonials, name: req.user.name });
});

app.get('/blogtestimonials', async (req, res) => {
    let titlesOnly = req.query.titlesOnly;
    let testimonial = req.query.testimonial;

    let testimonials = await Testimonial.find({published: 'on'}).sort({
        createdAt: 'desc'        
    });

    if(titlesOnly==="Y") {
        testimonials = testimonials.map(testimonial => {
            return {
                title: testimonial.title
                ,authorName: testimonial.authorName
                ,slug: testimonial.slug
                ,createdAt: new Date(testimonial.createdAt).toLocaleDateString()
            }
        })
    }
    if(testimonial !== undefined && testimonial !== null) {
        testimonials = testimonials.filter(testimonial => {
            return testimonial.slug===testimonial
        })
    }

    res.send({ testimonials: testimonials});
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login');
});

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register');
});

app.post('/login', initUsers, checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        let user = new User();
        user.name = req.body.name;
        user.email = req.body.email;
        user.password = hashedPassword;

        user = await user.save();

        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
    console.log(users);
});

app.delete('/logout', (req, res) => {
    users.length = 0;
    req.logOut();
    return res.redirect('/login');
});

app.post('/send', checkNotAuthenticated, (req, res, next) => {
    let fname = req.body.fname;
    let lname = req.body.lname;
    let fullname = fname + ' ' + lname; 
    let email = req.body.email;
    let phonenumber = req.body.phonenumber;
    let message = req.body.message;

    let htmlToSend = `
    <h1>Contact Information</h1>
    <table style="border: 1px solid black; padding: 15px; background-color: #f5f5f5;">
    <tr><td><b>First Name<b></td><td>${fname}</td></tr>
    <tr><td><b>Last Name<b></td><td>${lname}</td></tr>
    <tr><td><b>Full Name<b></td><td>${fullname}</td></tr>
    <tr><td><b>Email ID<b></td><td>${email}</td></tr>
    <tr><td><b>Phone Number<b></td><td>${phonenumber}</td></tr>
    <tr><td><b>Contact Message<b></td></tr>
    <tr><td>${message}</td></tr>
    </table>`;

    let mail = {
        from: process.env.USER,
        to: 'skillcurves@gmail.com',  //Change to email address that you want to receive messages on
        subject: 'Skill Curves Contact',
        html: htmlToSend
    };

    transporter.sendMail(mail, (err, data) => {
        if (err) {
            res.json({
                msg: 'fail'
            })
        } else {
            res.json({
                msg: 'success'
            })
        }
    })
});

app.post('/subscribe', checkNotAuthenticated, (req, res, next) => {
    let subscriber = req.body.subscriber;
    let htmlToSend = `
    <h1>Contact Information</h1>
    <table style="border: 1px solid black; padding: 15px; background-color: #f5f5f5;">
    <tr><td><b>Email Subscriber<b></td><td>${subscriber}</td></tr>
    </table>`;

    let mail = {
        from: process.env.USER,
        to: 'skillcurves@gmail.com',  //Change to email address that you want to receive messages on
        subject: 'Skill Curves Newsletter Subscriber',
        html: htmlToSend
    };

    transporter.sendMail(mail, (err, data) => {
        if (err) {
            res.json({
                msg: 'fail'
            })
        } else {
            res.json({
                msg: 'success'
            })
        }
    })
});

app.use('/articles', articleRouter);
app.use('/quotes', quoteRouter);
app.use('/testimonials', testimonialRouter);

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    return res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    next();
}

app.listen(process.env.PORT || 5000);