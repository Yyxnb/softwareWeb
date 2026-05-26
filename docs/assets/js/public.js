const STORAGE_KEY = "software-center-catalog-v2";

const categoryList = document.querySelector("#categoryList");
const content = document.querySelector("#content");
let catalog = loadCatalog();

function loadCatalog() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed.categories)) return parsed;
    } catch {
      // Fall back to bundled data.
    }
  }
  return structuredClone(window.SOFTWARE_CATALOG);
}

function setSelected(next) {
  catalog.selected = next;
  render();
}

function findCategory(categoryId) {
  return catalog.categories.find((item) => item.id === categoryId);
}

function findProduct(categoryId, productId) {
  const category = findCategory(categoryId);
  return category?.products.find((item) => item.id === productId);
}

function render() {
  renderTree();
  renderContent();
}

function renderTree() {
  categoryList.innerHTML = catalog.categories.map((category) => {
    const activeCategory = catalog.selected.type === "category" && catalog.selected.categoryId === category.id;
    const products = category.products.map((product) => {
      const activeProduct = catalog.selected.type === "product" && catalog.selected.productId === product.id;
      return `
        <button class="product-row ${activeProduct ? "active" : ""}" data-product="${product.id}" data-category="${category.id}">
          ${escapeHtml(product.name)}
          <small>${escapeHtml(product.folder || "")}</small>
        </button>
      `;
    }).join("");

    return `
      <div class="category-block">
        <button class="category-row ${activeCategory ? "active" : ""}" data-category="${category.id}">
          <span>${escapeHtml(category.name)}</span>
          <span>${category.products.length}</span>
        </button>
        <div class="product-list">${products}</div>
      </div>
    `;
  }).join("");

  categoryList.querySelectorAll("[data-category]:not([data-product])").forEach((button) => {
    button.addEventListener("click", () => setSelected({ type: "category", categoryId: button.dataset.category }));
  });
  categoryList.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => setSelected({
      type: "product",
      categoryId: button.dataset.category,
      productId: button.dataset.product
    }));
  });
}

function renderContent() {
  if (catalog.selected.type === "category") {
    renderCategory(findCategory(catalog.selected.categoryId) || catalog.categories[0]);
    return;
  }

  const product = findProduct(catalog.selected.categoryId, catalog.selected.productId);
  if (product) {
    renderProduct(product);
  } else {
    renderCategory(catalog.categories[0]);
  }
}

function renderCategory(category) {
  content.innerHTML = `
    <div class="hero">
      <div>
        <span class="pill">分类</span>
        <h2>${escapeHtml(category.name)}</h2>
        <p class="summary">${escapeHtml(category.description || "这个分类暂时没有说明。")}</p>
      </div>
    </div>
    <div class="grid">
      ${category.products.map((product) => `
        <article class="card">
          <span class="pill">${escapeHtml(product.folder || product.id)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="summary">${escapeHtml(product.summary || "")}</p>
          <button class="primary" data-open-product="${product.id}">查看详情</button>
        </article>
      `).join("") || `<p class="empty">这个分类下还没有软件。</p>`}
    </div>
  `;

  content.querySelectorAll("[data-open-product]").forEach((button) => {
    button.addEventListener("click", () => setSelected({
      type: "product",
      categoryId: category.id,
      productId: button.dataset.openProduct
    }));
  });
}

function renderProduct(product) {
  content.innerHTML = `
    <div class="hero">
      <div>
        <span class="pill">${escapeHtml(product.folder || "software")}</span>
        <h2>${escapeHtml(product.name)}</h2>
        <p class="summary">${escapeHtml(product.summary || "")}</p>
      </div>
    </div>

    <div class="grid">
      <section class="card">
        <h3>主程序下载</h3>
        ${renderDownloadList(product.downloads)}
      </section>

      <section class="card">
        <h3>配套工具下载</h3>
        ${renderDownloadList(product.tools)}
      </section>

      <section class="card wide">
        <h3>使用说明</h3>
        <div class="doc-box">${escapeHtml(product.docs || "还没有使用说明。")}</div>
      </section>

      <section class="card">
        <h3>更新日志</h3>
        ${renderTimeline(product.changelog)}
      </section>

      <section class="card">
        <h3>历史版本</h3>
        ${renderHistory(product.history)}
      </section>
    </div>
  `;
}

function renderDownloadList(items = []) {
  if (!items.length) return `<p class="empty">暂无下载项。</p>`;
  return items.map((item) => `
    <div class="download-card">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.version || "")} ${escapeHtml(item.note || "")}</p>
      </div>
      <a href="${escapeAttr(item.url || "#")}" target="_blank" rel="noopener">下载</a>
    </div>
  `).join("");
}

function renderTimeline(items = []) {
  if (!items.length) return `<p class="empty">暂无更新日志。</p>`;
  return `<div class="timeline">${items.map((item) => `
    <div class="timeline-item">
      <strong>${escapeHtml(item.version || "")} ${escapeHtml(item.date || "")}</strong>
      <p>${escapeHtml(item.text || item.note || "")}</p>
    </div>
  `).join("")}</div>`;
}

function renderHistory(items = []) {
  if (!items.length) return `<p class="empty">暂无历史版本。</p>`;
  return `<div class="timeline">${items.map((item) => `
    <div class="timeline-item">
      <strong>${escapeHtml(item.version || "")} ${escapeHtml(item.date || "")}</strong>
      <p>${escapeHtml(item.note || "")}</p>
      <a href="${escapeAttr(item.url || "#")}" target="_blank" rel="noopener">下载历史版本</a>
    </div>
  `).join("")}</div>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

render();
