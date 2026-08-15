// ============================================================
// Cart — stored in localStorage so it works for guests too.
// Shows a slide-in confirmation drawer instead of a plain alert.
// Checkout page writes the order to Supabase (requires login).
// ============================================================

const CART_KEY = "cara_cart";
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_FEE = 2;

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

function addToCart(product, qty = 1) {
  if (!product) return;
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, qty });
  }
  saveCart(cart);
  showAddedDrawer(product, qty);
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

function shippingFor(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
}

function updateCartBadge() {
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll("#cart-count").forEach(b => b.textContent = count);
}

// ---------- Slide-in "added to cart" drawer (used on shop/product pages) ----------
function showAddedDrawer(product, qty) {
  let drawer = document.getElementById("added-drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "added-drawer";
    drawer.className = "added-drawer";
    document.body.appendChild(drawer);
  }
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  drawer.innerHTML = `
    <div class="added-drawer-inner">
      <img src="${product.image_url || 'img/product/f1.jpg'}" alt="${product.name}">
      <div class="added-drawer-text">
        <strong>${product.name}</strong>
        <span>${qty} added to your bag</span>
      </div>
      <a href="cart.html" class="btn-primary added-drawer-btn">View Bag (${count})</a>
    </div>`;
  drawer.classList.add("show");
  clearTimeout(drawer._hideTimer);
  drawer._hideTimer = setTimeout(() => drawer.classList.remove("show"), 4000);
}

// ---------- Cart page rendering ----------
function renderCartPage() {
  const body = document.getElementById("cart-items");
  if (!body) return;
  const cart = getCart();

  if (cart.length === 0) {
    body.innerHTML = `<p class="cart-empty">Your bag is empty. <a href="shop.html">Continue shopping</a></p>`;
    renderCartSummary(cart);
    return;
  }

  body.innerHTML = cart.map(i => `
    <div class="cart-row">
      <img src="${i.image_url || 'img/product/f1.jpg'}" alt="${i.name}">
      <div class="cart-row-info">
        <h4>${i.name}</h4>
        <p class="cart-row-price">$${i.price.toFixed(2)}</p>
        <div class="qty-control">
          <button onclick="updateQty(${i.id}, ${i.qty - 1})">-</button>
          <span>${i.qty}</span>
          <button onclick="updateQty(${i.id}, ${i.qty + 1})">+</button>
          <a href="#" class="btn-danger cart-remove" onclick="removeFromCart(${i.id});return false;">Remove</a>
        </div>
      </div>
      <div class="cart-row-subtotal">$${(i.price * i.qty).toFixed(2)}</div>
    </div>`).join("");

  renderCartSummary(cart);
}

function renderCartSummary(cart) {
  const summary = document.getElementById("cart-summary-box");
  if (!summary) return;
  const subtotal = cartTotal(cart);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  summary.innerHTML = `
    <h3>Order Summary</h3>
    <div class="summary-line"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
    <div class="summary-line"><span>Shipping</span><span>${shipping === 0 ? "Free" : "$" + shipping.toFixed(2)}</span></div>
    ${subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD
      ? `<p class="summary-note">Add $${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping.</p>`
      : ""}
    <div class="summary-line summary-total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
    <a href="${cart.length ? 'checkout.html' : '#'}" class="btn-primary summary-checkout-btn" ${cart.length ? "" : "aria-disabled='true' style='opacity:.5;pointer-events:none;'"}>
      Proceed to Checkout
    </a>
    <a href="shop.html" class="summary-continue">Continue Shopping</a>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCartPage();
});
