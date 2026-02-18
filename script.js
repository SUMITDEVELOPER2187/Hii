const mealCatalog = [
  { id: 1, name: 'Protein Power Bowl', calories: 520, protein: 40, carbs: 48, fat: 14, price: 10.99, type: 'non-veg', goals: ['muscle-gain', 'maintenance'] },
  { id: 2, name: 'Green Detox Salad', calories: 340, protein: 12, carbs: 32, fat: 11, price: 8.49, type: 'veg', goals: ['weight-loss', 'maintenance'] },
  { id: 3, name: 'Balanced Veggie Plate', calories: 430, protein: 20, carbs: 45, fat: 14, price: 9.29, type: 'veg', goals: ['maintenance', 'weight-loss'] },
  { id: 4, name: 'Chicken Quinoa Box', calories: 620, protein: 48, carbs: 52, fat: 20, price: 11.49, type: 'non-veg', goals: ['muscle-gain', 'maintenance'] },
  { id: 5, name: 'Overnight Oats Combo', calories: 390, protein: 14, carbs: 57, fat: 12, price: 7.99, type: 'veg', goals: ['weight-loss', 'maintenance'] },
  { id: 6, name: 'Peanut Banana Smoothie', calories: 500, protein: 22, carbs: 53, fat: 20, price: 6.89, type: 'drink', goals: ['muscle-gain'] },
  { id: 7, name: 'Tofu Teriyaki Bowl', calories: 470, protein: 27, carbs: 51, fat: 16, price: 10.29, type: 'veg', goals: ['maintenance', 'muscle-gain'] },
  { id: 8, name: 'Lean Wrap Combo', calories: 410, protein: 29, carbs: 42, fat: 11, price: 9.79, type: 'non-veg', goals: ['weight-loss', 'maintenance'] }
];

const state = {
  profile: JSON.parse(localStorage.getItem('eatfit_profile') || 'null'),
  cart: JSON.parse(localStorage.getItem('eatfit_cart') || '[]'),
  sortAsc: true
};

const refs = {
  profileForm: document.getElementById('profileForm'),
  insights: document.getElementById('insights'),
  menu: document.getElementById('menu'),
  cartItems: document.getElementById('cartItems'),
  totalPrice: document.getElementById('totalPrice'),
  totalItems: document.getElementById('totalItems'),
  totalCalories: document.getElementById('totalCalories'),
  orderMessage: document.getElementById('orderMessage'),
  themeToggle: document.getElementById('themeToggle'),
  filterType: document.getElementById('filterType'),
  searchMeal: document.getElementById('searchMeal'),
  sortPrice: document.getElementById('sortPrice'),
  clearCart: document.getElementById('clearCart'),
  checkout: document.getElementById('checkout'),
  resetAll: document.getElementById('resetAll')
};

function saveState() {
  localStorage.setItem('eatfit_profile', JSON.stringify(state.profile));
  localStorage.setItem('eatfit_cart', JSON.stringify(state.cart));
}

function getDailyCalories(weight, activity, goal) {
  const base = weight * 30;
  const factors = { low: 0.9, moderate: 1, high: 1.12 };
  const goalDelta = { 'weight-loss': -350, maintenance: 0, 'muscle-gain': 280 };
  return Math.max(1200, Math.round(base * (factors[activity] || 1) + (goalDelta[goal] || 0)));
}

function getMacroTargets(calories, goal) {
  const split = {
    'weight-loss': { protein: 0.35, carbs: 0.35, fat: 0.30 },
    maintenance: { protein: 0.30, carbs: 0.40, fat: 0.30 },
    'muscle-gain': { protein: 0.30, carbs: 0.45, fat: 0.25 }
  }[goal];

  return {
    protein: Math.round((calories * split.protein) / 4),
    carbs: Math.round((calories * split.carbs) / 4),
    fat: Math.round((calories * split.fat) / 9)
  };
}

function getBmi(weight, heightCm) {
  const m = heightCm / 100;
  const bmi = weight / (m * m);
  let label = 'Normal';
  if (bmi < 18.5) label = 'Underweight';
  else if (bmi >= 25 && bmi < 30) label = 'Overweight';
  else if (bmi >= 30) label = 'Obese';
  return { value: bmi.toFixed(1), label };
}

function findMealById(id) {
  return mealCatalog.find((meal) => meal.id === id);
}

function getFilteredMeals() {
  const filterType = refs.filterType.value;
  const keyword = refs.searchMeal.value.trim().toLowerCase();

  let list = [...mealCatalog];
  if (state.profile?.goal) {
    list = list.filter((meal) => meal.goals.includes(state.profile.goal));
  }

  if (filterType !== 'all') {
    list = list.filter((meal) => meal.type === filterType);
  }

  if (keyword) {
    list = list.filter((meal) => meal.name.toLowerCase().includes(keyword));
  }

  list.sort((a, b) => (state.sortAsc ? a.price - b.price : b.price - a.price));
  return list;
}

function renderMenu() {
  const items = getFilteredMeals();
  refs.menu.innerHTML = '';

  if (items.length === 0) {
    refs.menu.innerHTML = '<p class="muted">No meals found for this filter/search.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'menu-item';
    card.innerHTML = `
      <h5>${item.name}</h5>
      <div class="meta"><span>${item.calories} kcal</span><span>${item.type}</span></div>
      <div class="meta"><span>P ${item.protein}g • C ${item.carbs}g • F ${item.fat}g</span></div>
      <p><strong>$${item.price.toFixed(2)}</strong></p>
      <button class="primary" data-action="add" data-id="${item.id}">Add to Cart</button>
    `;
    refs.menu.appendChild(card);
  });
}

function renderInsights() {
  if (!state.profile) {
    refs.insights.className = 'insights muted';
    refs.insights.textContent = 'Complete your profile to unlock your nutrition dashboard.';
    return;
  }

  const { name, goal, calories, weight, height } = state.profile;
  const bmi = getBmi(weight, height);
  const macros = getMacroTargets(calories, goal);
  const tips = {
    'weight-loss': 'Prioritize lean proteins, high-fiber veggies, and lower-calorie density meals.',
    maintenance: 'Keep a balanced plate with sustainable calories and hydration.',
    'muscle-gain': 'Increase meal frequency with high protein and complex carbs.'
  };

  refs.insights.className = 'insights';
  refs.insights.innerHTML = `
    <div><strong>${name}</strong>, your personalized target is <strong>${calories} kcal/day</strong>.</div>
    <div class="macro-grid">
      <div class="macro"><strong>BMI</strong><br/>${bmi.value} (${bmi.label})</div>
      <div class="macro"><strong>Protein</strong><br/>${macros.protein} g/day</div>
      <div class="macro"><strong>Carbs</strong><br/>${macros.carbs} g/day</div>
      <div class="macro"><strong>Fat</strong><br/>${macros.fat} g/day</div>
    </div>
    <div class="macro">💡 ${tips[goal]}</div>
  `;
}

function cartTotals() {
  return state.cart.reduce(
    (acc, row) => {
      const meal = findMealById(row.id);
      if (!meal) return acc;
      acc.items += row.qty;
      acc.price += meal.price * row.qty;
      acc.calories += meal.calories * row.qty;
      return acc;
    },
    { items: 0, price: 0, calories: 0 }
  );
}

function renderCart() {
  refs.cartItems.innerHTML = '';

  if (state.cart.length === 0) {
    refs.cartItems.innerHTML = '<li class="muted">No items yet.</li>';
  } else {
    state.cart.forEach((row) => {
      const meal = findMealById(row.id);
      if (!meal) return;

      const li = document.createElement('li');
      li.className = 'cart-row';
      li.innerHTML = `
        <span>${meal.name}</span>
        <span class="qty">
          <button data-action="decrease" data-id="${row.id}">−</button>
          <strong>${row.qty}</strong>
          <button data-action="increase" data-id="${row.id}">+</button>
          <button data-action="remove" data-id="${row.id}" class="danger" title="Remove item">✕</button>
        </span>
      `;
      refs.cartItems.appendChild(li);
    });
  }

  const totals = cartTotals();
  refs.totalItems.textContent = totals.items;
  refs.totalPrice.textContent = totals.price.toFixed(2);
  refs.totalCalories.textContent = totals.calories;
}

function addToCart(id) {
  const current = state.cart.find((row) => row.id === id);
  if (current) current.qty += 1;
  else state.cart.push({ id, qty: 1 });
  saveState();
  renderCart();
}

function updateQty(id, delta) {
  const row = state.cart.find((item) => item.id === id);
  if (!row) return;
  row.qty += delta;
  if (row.qty <= 0) {
    state.cart = state.cart.filter((item) => item.id !== id);
  }
  saveState();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveState();
  renderCart();
}

function setThemeFromStorage() {
  const theme = localStorage.getItem('eatfit_theme') || 'light';
  document.body.classList.toggle('dark', theme === 'dark');
  refs.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function applyProfileToForm() {
  if (!state.profile) return;
  document.getElementById('name').value = state.profile.name;
  document.getElementById('age').value = state.profile.age;
  document.getElementById('weight').value = state.profile.weight;
  document.getElementById('height').value = state.profile.height;
  document.getElementById('goal').value = state.profile.goal;
  document.getElementById('activity').value = state.profile.activity;
  document.getElementById('budget').value = state.profile.budget;
}

refs.profileForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const profile = {
    name: document.getElementById('name').value.trim(),
    age: Number(document.getElementById('age').value),
    weight: Number(document.getElementById('weight').value),
    height: Number(document.getElementById('height').value),
    goal: document.getElementById('goal').value,
    activity: document.getElementById('activity').value,
    budget: Number(document.getElementById('budget').value)
  };

  profile.calories = getDailyCalories(profile.weight, profile.activity, profile.goal);
  state.profile = profile;
  refs.orderMessage.textContent = 'Profile updated. Recommendations refreshed.';
  saveState();
  renderInsights();
  renderMenu();
});

refs.menu.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="add"]');
  if (!button) return;
  addToCart(Number(button.dataset.id));
  refs.orderMessage.textContent = 'Added to cart.';
});

refs.cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const id = Number(button.dataset.id);
  if (action === 'increase') updateQty(id, 1);
  if (action === 'decrease') updateQty(id, -1);
  if (action === 'remove') removeFromCart(id);
});

refs.checkout.addEventListener('click', () => {
  const totals = cartTotals();

  if (totals.items === 0) {
    refs.orderMessage.textContent = 'Please add at least one meal before checkout.';
    return;
  }

  if (state.profile && totals.price > state.profile.budget) {
    refs.orderMessage.textContent = `Cart exceeds your budget by $${(totals.price - state.profile.budget).toFixed(2)}. Adjust items.`;
    return;
  }

  const customerName = state.profile?.name || 'Guest';
  refs.orderMessage.textContent = `✅ Order placed for ${customerName}! ETA: 25-35 mins.`;
  state.cart = [];
  saveState();
  renderCart();
});

refs.clearCart.addEventListener('click', () => {
  state.cart = [];
  saveState();
  renderCart();
  refs.orderMessage.textContent = 'Cart cleared.';
});

refs.themeToggle.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('eatfit_theme', isDark ? 'dark' : 'light');
  refs.themeToggle.textContent = isDark ? '☀️' : '🌙';
});

refs.filterType.addEventListener('change', renderMenu);
refs.searchMeal.addEventListener('input', renderMenu);
refs.sortPrice.addEventListener('click', () => {
  state.sortAsc = !state.sortAsc;
  refs.sortPrice.textContent = state.sortAsc ? 'Sort: Price ↑' : 'Sort: Price ↓';
  renderMenu();
});

refs.resetAll.addEventListener('click', () => {
  localStorage.removeItem('eatfit_profile');
  localStorage.removeItem('eatfit_cart');
  state.profile = null;
  state.cart = [];
  refs.profileForm.reset();
  refs.orderMessage.textContent = 'All data reset.';
  renderInsights();
  renderMenu();
  renderCart();
});

setThemeFromStorage();
applyProfileToForm();
renderInsights();
renderMenu();
renderCart();
