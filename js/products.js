// ============================================================
// Loads real products from Supabase into the existing
// .pro-container markup used on index.html and shop.html.
// ============================================================

function starsHtml(rating) {
  let html = "";
  const full = Math.round(rating);
  for (let i = 1; i <= 5; i++) {
    html += `<i class="${i <= full ? "fas" : "far"} fa-star"></i>`;
  }
  return html;
}

function productCardHtml(p) {
  return `
    <div class="pro" data-id="${p.id}">
        <a href="product.html?id=${p.id}">
            <img src="${p.image_url || 'img/product/f1.jpg'}" alt="${p.name}">
            <div class="des">
                <span>${p.brand || ""}</span>
                <h5>${p.name}</h5>
                <div class="star">${starsHtml(p.rating || 5)}</div>
                <h4>$${Number(p.price).toFixed(2)}</h4>
            </div>
        </a>
        <a href="#" class="cart-btn"><i class="fal fa-shopping-cart cart"></i></a>
    </div>`;
}

// Renders products into a container. limit=null means "all".
// Renders products into a container. limit=null means "all".
async function loadProducts(containerSelector, { limit = null, categoryName = null } = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let query = supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false });
  // Only apply the DB limit when we are NOT filtering by category —
  // otherwise the limit can cut off rows before the category filter runs,
  // leaving nothing to show even though matching products exist.
  if (limit && !categoryName) query = query.limit(limit);
  const { data: products, error } = await query;

  if (error) {
    container.innerHTML = `<p>Could not load products right now.</p>`;
    console.error(error);
    return;
  }

  let filtered = categoryName
    ? products.filter(p => p.categories && p.categories.name === categoryName)
    : products;

  if (limit) filtered = filtered.slice(0, limit);

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `<p>No products yet — check back soon!</p>`;
    return;
  

  container.innerHTML = filtered.map(productCardHtml).join("");

  // wire "add to cart" buttons
  container.querySelectorAll(".cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.closest(".pro").dataset.id;
      const product = filtered.find(p => String(p.id) === id);
      addToCart(product);
    });
  });
}

  // wire "add to cart" buttons
  container.querySelectorAll(".cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.closest(".pro").dataset.id;
      const product = filtered.find(p => String(p.id) === id);
      addToCart(product);
    });
  });
}
