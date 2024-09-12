const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/product");

dotenv.config();

const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("MongoDB connected for seeding");
})
.catch(err => {
    console.log("Connection Error", err);
});

const products = [
    {
        name: "Wireless Bluetooth Headphones",
        price: 59.99,
        description: "High-quality wireless headphones with noise cancellation.",
        category: "Electronics",
        image: "https://www.bhphotovideo.com/images/fb/skullcandy_s6hbgy_384_hesh_2_bluetooth_headphones_gray_hot_1085704.jpg"
    },
    {
        name: "Smartwatch Series 5",
        price: 199.99,
        description: "sadasf",
        category: "Electronics",
        image: "https://static.bhphoto.com/images/images500x500/1568144276_1506023.jpg"
    },
    {
        name: "Organic Cotton T-Shirt",
        price: 25.00,
        description: "Comfortable and eco-friendly organic cotton t-shirt.",
        category: "Apparel",
        image: "https://i.etsystatic.com/23748895/r/il/5ecb1d/5247232592/il_1140xN.5247232592_ltjm.jpg"
    },
    {
        name: "Gaming Mouse",
        price: 49.99,
        description: "Ergonomic gaming mouse with customizable DPI settings.",
        category: "Electronics",
        image: "https://m.media-amazon.com/images/I/61g6+mPa7VL._AC_SL1500_.jpg"
    },
];

const seedDB = async () => {
    try{
        await Product.deleteMany({});
        console.log('Existing products removed');
        
        await Product.insertMany(products);
        console.log("Products added to Inventory");

        mongoose.connection.close();
        console.log("Connection to DB is closed");
    } catch(err) {
        console.log("Error seeding database", err);
        mongoose.connection.close();
    } 
};

seedDB();