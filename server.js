const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const session = require('express-session');
const passport = require('passport');
const Cart = require('./models/cart');



const PORT = 2000;

dotenv.config();

const app = express();

app.set("view engine", "ejs");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended:true }));
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
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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

app.get('/login', (req,res) => {
    res.render('reg');
})

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