module.exports = function Cart(oldCart) {
  this.items = oldCart.items || {}; // Store items in an object
  this.totalQty = oldCart.totalQty || 0; // Total quantity of items in the cart
  this.totalPrice = oldCart.totalPrice || 0; // Total price of the items in the cart
  // Add a new item or increase its quantity
  this.add = function(item, id) {
    let storedItem = this.items[id];
    if (!storedItem) {
      storedItem = this.items[id] = { item: item, qty: 0, price: 0 };
    }
    storedItem.qty++;
    storedItem.price = storedItem.item.price * storedItem.qty;
    this.totalQty++;
    this.totalPrice += storedItem.item.price;
  };
  this.remove = function(id) {
    let storedItem = this.items[id];
    if (storedItem.qty > 1) {
      storedItem.qty--;
      storedItem.price = storedItem.item.price * storedItem.qty;
      this.totalQty--;
      this.totalPrice -= storedItem.item.price;
    } else if(storedItem.qty == 1) {
      delete this.items[id];
      this.totalPrice -=storedItem.item.price;
    }
  };
  // Generate an array of items for easy iteration
  this.generateArray = function() {
    let arr = [];
    for (let id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  };
};
  