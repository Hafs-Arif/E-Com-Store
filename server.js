const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/product');
const session = require('express-session');
const passport = require('passport');
const Cart = require('./models/cart');
const user = require("./models/user");
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');

require('./config/passport')(passport);


const PORT = process.env.PORT || 2000;

dotenv.config();

const app = express();

app.set("view engine", "ejs");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended:false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req,res) => {
  try{
    const products = await Product.find({});
    res.render('index', { products });
  } catch (err) {
    console.log("Error fetching products!", err);
  }

});

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // Set to true if using HTTPS
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 180 * 60 * 1000 }  
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id); // Ensure you are passing the correct user id
});

passport.deserializeUser(async (id, done) => {
  try {
    const User = await user.findById(id); // Find the user by id
    done(null, User);
  } catch (err) {
    done(err, null);
  }
});

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.get('/cart', (req, res) => {
  const cart = req.session.cart ? new Cart(req.session.cart) : null;
  // Fetch products from cart if cart exists
  const products = cart ? cart.generateArray() : [];

  res.render('cart', { cart: cart, products: products, totalPrice: cart ? cart.totalPrice : 0 });
});

app.get('/add-to-cart/:id', async (req, res) => {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  try {
    const product = await Product.findById(productId); // Fetch the product by its ID
    if (!product) {
      return res.redirect('/');
    }
    
    if (req.isAuthenticated()) {
    cart.add(product, product.id);
    req.session.cart = cart; // Save cart to session
    console.log(req.session.cart); // For debugging purposes
      return res.redirect('/');
    } else {
      res.redirect('/login');
    }

    // res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/remove/:id', (req, res) => {
  const productId = req.params.id;
  let cart = new Cart(req.session.cart ? req.session.cart : {});

  // Remove the product from the cart
  cart.remove(productId);

  req.session.cart = cart; // Update session with the modified cart
  res.redirect('/cart');
});

app.get('/account', ensureAuthenticated, (req, res) => {
  res.render('account.ejs', { user: req.user });
});

app.get('/logout', (req, res, next) => {

  req.logout(function(err) {
    if (err) {
      return next(err);
    }

    // Optionally destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }

      // Redirect to the login page or home after logout
      res.redirect('/login');  // Redirect the user to the login page or home
    });
  });
});


function ensureAuthenticated(req, res, next) {
  console.log("Authenticated:", req.isAuthenticated());
  console.log("User Session:", req.user);
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/account', // Redirect to account page after successful login
    failureRedirect: '/login',   // Redirect back to login if authentication fails
    failureFlash: true           // Enable flash messages on failure
  })(req, res, next);
});

app.post('/login', (req, res, next) => {
  console.log('Login attempt:', req.body); // Debug incoming login data
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      console.log('Authentication failed:', info.message); // Show error message in console
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      console.log('Login successful for user:', user.email);
      return res.redirect('/account');
    });
  })(req, res, next);
});

app.get('/login', (req,res) => {
    res.render('reg', { message: req.flash('error') });
});

app.post('/register', async (req,res) => {
  const { username, password, email } = req.body;
  console.log(req.body);

  try{
    const existingUser = await user.findOne({ email }).exec();
    if(existingUser) {
      return res.status(400).send('User already exists');
    }

    if (!password) {
      return res.status(400).send('Password is required');
    }

    //console.log("Plain password (before hashing):", password);

    const hashedPassword = await bcrypt.hash(password, 10);

    // console.log("Hashed password:", hashedPassword);

    const newUser = new user({
      username,
      email,
      password
    });

    await newUser.save();

    req.login(newUser, (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Login failed after registration. Please try logging in manually.');
        return res.redirect('/login');
      }

      req.flash('success', 'You are now registered and logged in.');
      res.redirect('/account');
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

app.post('/add-to-cart/:id', async (req, res) => {
  const productId = req.params.id;

  // Initialize cart if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = {
      items: [],
      totalPrice: 0,
      totalQty: 0
    };
  }

  const product = await Product.findById(productId);
  // Add product to the cart
  req.session.cart.items.push(product);
  req.session.cart.totalPrice += product.price;
  req.session.cart.totalQty += 1;

  res.redirect('/cart');
  res.send('Item added to cart!');
});

app.listen(PORT, (req,res) => {
    console.log(`Server is runiung on port: ${PORT}`);
});