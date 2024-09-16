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
  if (!req.session.cart) {
    return res.render('cart', { products: null });
  }
  let cart = new Cart(req.session.cart);
  res.render('cart', { products: cart.generateArray(), totalPrice: cart.totalPrice });
});

app.get('/add-to-cart/:id', async (req, res) => {
  const productId = req.params.id;
  let cart = new Cart(req.session.cart ? req.session.cart : {});

  try {
    const product = await Product.findById(productId); // Fetch the product by its ID
    if (!product) {
      return res.redirect('/');
    }
    cart.add(product, product.id);
    req.session.cart = cart; // Save cart to session
    console.log(req.session.cart); // For debugging purposes
    res.redirect('/');
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
  
  
app.get('/account', (req,res) => {
    const user = req.session.user || null;

    if (!user) {
      res.redirect('/login'); // Redirect to login if the user is not logged in
    } else {
      res.render('account', { user });
    }
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/', // Redirect to homepage upon success
  failureRedirect: '/login', // Redirect to login page on failure
  failureFlash: true // Enable flash messages for errors
}));

app.get('/login', (req,res) => {
    res.render('reg');
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

    console.log("Plain password (before hashing):", password);

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Hashed password:", hashedPassword);

    const newUser = new user({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    req.login(newUser, (err) => {
      if (err) {
        console.error(err);
        req.flash('error', 'Login failed after registration. Please try logging in manually.');
        return res.redirect('/login');
      }

      req.flash('success', 'You are now registered and logged in.');
      res.redirect('/');
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

// app.post('/login', async (req,res) => {
//   const { email, password } = req.body;



//   try {
//     const existingUser = await user.findOne({ email }).exec();
//     if(!existingUser){
//       res.status(404).send('User not found.Please register.');
//     }

//     console.log("Plain password: ", password); // Log plain password
//     console.log("Hashed password in DB: ", existingUser.password);

//     const isMatch = await bcrypt.compare(password, existingUser.password);
//     if (!isMatch) {
//       return res.status(400).send('Incorrect password.');
//     }

//     req.login(existingUser, (err) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).send('Server error during login.');
//       }
//       res.redirect('/account'); // Redirect to account page after successful login
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).send('Server error');
//   }
// })

app.post('/add-to-cart/:id', async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);

  // Initialize cart if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = {
      items: [],
      totalPrice: 0,
      totalQty: 0
    };
  }

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