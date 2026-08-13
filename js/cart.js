// ============================================================
// Cart — stored in localStorage so it works for guests too.
// Checkout writes the order to Supabase (requires login).
// ============================================================

const CART_KEY = "cara_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product) {
  if (!product) return;
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, qty: 1 });
  }
  saveCart(cart);
  alert(`${product.name} added to cart!`);
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
  renderCartPage();
}

function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty = Math.max(1, qty);
  saveCart(cart);
  renderCartPage();
}

function cartTotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartBadge() {
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = count;
}

// Renders the cart table on cart.html
function renderCartPage() {
  const body = document.getElementById("cart-body");
  const totalEl = document.getElementById("cart-total");
  if (!body) return;
  const cart = getCart();

  if (cart.length === 0) {
    body.innerHTML = `<tr><td colspan="4">Your cart is empty. <a href="shop.html">Go shopping</a></td></tr>`;
    if (totalEl) totalEl.textContent = "$0.00";
    return;
  }

  body.innerHTML = cart.map(i => `
    <tr>
      <td><img src="${i.image_url || 'img/product/f1.jpg'}" alt="${i.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;"> ${i.name}</td>
      <td>$${i.price.toFixed(2)}</td>
      <td><input type="number" min="1" value="${i.qty}" style="width:60px" onchange="updateQty(${i.id}, parseInt(this.value))"></td>
      <td>$${(i.price * i.qty).toFixed(2)} <a href="#" onclick="removeFromCart(${i.id});return false;"><i class="fal fa-trash-alt"></i></a></td>
    </tr>`).join("");

  if (totalEl) totalEl.textContent = `$${cartTotal(cart).toFixed(2)}`;
}

async function checkout() {
  const { user } = await getCurrentUser();
  const msg = document.getElementById("checkout-msg");
  const cart = getCart();

  if (!user) {
    window.location.href = "login.html?redirect=cart.html";
    return;
  }
  if (cart.length === 0) {
    if (msg) msg.textContent = "Your cart is empty.";
    return;
  }

  if (msg) { msg.style.color = "#088178"; msg.textContent = "Placing your order..."; }

  const total = cartTotal(cart);
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({ user_id: user.id, total, status: "pending" })
    .select()
    .single();

  if (orderErr) {
    if (msg) { msg.style.color = "#e63946"; msg.textContent = orderErr.message; }
    return;
  }

  const items = cart.map(i => ({ order_id: order.id, product_id: i.id, quantity: i.qty, price: i.price }));
  const { error: itemsErr } = await supabase.from("order_items").insert(items);

  if (itemsErr) {
    if (msg) { msg.style.color = "#e63946"; msg.textContent = itemsErr.message; }
    return;
  }

  saveCart([]);
  renderCartPage();
  if (msg) { msg.style.color = "#088178"; msg.textContent = "Order placed! Thank you for shopping with us."; }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCartPage();
});
