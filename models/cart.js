module.exports = function Cart(oldCart) {
  // If oldCart exists, use its items; otherwise, initialize as an empty array
  this.items = oldCart?.items || [];
  this.totalQty = oldCart?.totalQty || 0;
  this.totalPrice = oldCart?.totalPrice || 0;


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
    return Object.values(this.items);
  };
};
  