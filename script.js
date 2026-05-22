/**
* Умный список вещей для поездки
* Поддерживает несколько типов поездок, погодные условия и постоянное состояние пользовательского интерфейса.
* Функции:
* - динамическая генерация списков вещей
* - сохранение данных в localStorage
* - экспорт в Markdown
* - интерактивный пользовательский интерфейс
*/

/**
// Набор правил, определяющих стандартные предметы для упаковки в зависимости от типа поездки
// @type {Object}
*/
const rules = {
  beach: {
    clothing: ["Swimwear", "Beach towel", "Flip-flops"]
  },
  business: {
    clothing: ["Business outfit (suit/dress)", "Dress shoes"],
    electronics: ["Laptop"]
  },
  camping: {
    clothing: ["Hiking boots"],
    misc: ["Tent", "Sleeping bag", "Headlamp/flashlight"]
  },
  leisure: {
    clothing: []
  }
};

const randomTrips = ["beach", "business", "camping", "leisure"];


/**
* Форматирует название товара с указанием количества, если count > 1.
* Пример: "Рубашки (3)" или "Одежда для сна"
* @param {string} name - Название товара
* @param {number} count - Количество товара
* @returns {string} - Отформатированная метка
*/
function qtyLabel(name, count){
  return count>1?`${name} (${count})`:name;
}


/**
// Генерирует список вещей для поездки на основе параметров путешествия.
// @param {number} days - Продолжительность поездки в днях
// @param {string} type - Тип поездки (пляжная, деловая, кемпинговая, отдых)
// @param {string} temp - Ожидаемые погодные условия (холодно, жарко, умеренно)
// @returns {Object} categories - Структурированный список вещей, сгруппированный по категориям
*/
function generatePacking(days, type, temp){
  const cat = {
    "Clothing":[],
    "Toiletries":[],
    "Electronics":[],
    "Misc":[]
  };

  // Базовая логика для расчета количества одежды в зависимости от продолжительности поездки
  const underwear = days;
  const socks = days;
  const shirts = Math.ceil(days);
  const pants = Math.ceil(days/2);

  cat.Clothing.push(qtyLabel('Underwear',underwear));
  cat.Clothing.push(qtyLabel('Socks',socks));
  cat.Clothing.push(qtyLabel('Shirts',shirts));
  cat.Clothing.push(qtyLabel('Pants',pants));
  cat.Clothing.push('Sleepwear');

  // Правила в зависимости от типа поездки
  const tripRules = rules[type];
  if (tripRules) {
    if (tripRules.clothing) cat.Clothing.push(...tripRules.clothing);
    if (tripRules.electronics) cat.Electronics.push(...tripRules.electronics);
    if (tripRules.misc) cat.Misc.push(...tripRules.misc);
  }

  if (temp === "cold") {
    cat.Clothing.push(qtyLabel("Coat", 1));
    cat.Clothing.push(qtyLabel("Sweater", Math.ceil(days / 2)));
  }

  if (temp === "hot") {
    cat.Clothing.push(qtyLabel("T-shirts", Math.ceil(days)));
    cat.Clothing.push(qtyLabel("Shorts", Math.ceil(days / 2)));
    cat.Toiletries.push("Sunscreen");
  }

  // Скорректированные значения для всех типов поездок
  cat.Toiletries.push(
    "Toothbrush",
    "Toothpaste",
    "Deodorant",
    "Shampoo/soap",
    "Medications"
  );

  cat.Electronics.push(
    "Phone + charger",
    "Earbuds/headphones",
    "Portable charger"
  );

  cat.Misc.push(
    "Passport/ID",
    "Travel documents",
    "Wallet / cards",
    "Reusable water bottle"
  );

  return cat;
}


/**
// Отображает пользовательский интерфейс списка товаров в DOM с сохранением состояния флажков.
// @param {Object} categories - Товары для упаковки, сгруппированные по категориям
// @param {string} storageKey - Ключ для сохранения состояния в localStorage
*/
function renderChecklist(categories, storageKey){
  const container = document.getElementById('checklist');
  
  // Пустой запрос данных - отображает приглашение к генерации списка
  if (!categories) {
    container.innerHTML = "<p>Generate your packing list </p>";
    return;
  }
  container.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");

  Object.keys(categories).forEach(cat => {
    const items = categories[cat];
    if(items.length===0) return;
    
    const h = document.createElement('h3');
    h.textContent = cat;
    container.appendChild(h);
    
    const ul = document.createElement('ul');
    items.forEach((it, idx) => {
      const li = document.createElement('li');
      const id = `i-${cat}-${idx}`.replace(/\s+/g,'-');
      const cb = document.createElement('input');
      cb.type='checkbox';
      cb.id = id;
      
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = it;

      if(saved[id]){
        cb.checked = true;
        li.classList.add('packed');
      }

      cb.addEventListener("change", () => {
        const cur = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (cb.checked) {
          cur[id] = true;
          li.classList.add("packed");
        } else {
          delete cur[id];
          li.classList.remove("packed");
        }
        localStorage.setItem(storageKey, JSON.stringify(cur));
      });

      li.appendChild(cb);
      li.appendChild(label);
      ul.appendChild(li);
    });
    container.appendChild(ul);
  });
}


/**
// Преобразует список необходимых вещей в формат Markdown.
// @param {number} - дней
// @param {string} - тип
// @param {string} - временный
// @param {Object} - категории
// @param {string} - ключ хранилища
// @returns {string} - представление списка необходимых вещей в формате Markdown
*/
function buildMarkdown(days, type, temp, categories, storageKey){
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  let md = `# Packing Checklist — ${days} day${days>1?'s':''} (${type}, ${temp})\n\n`;
  Object.keys(categories).forEach(cat => {
    const items = categories[cat];
    if(items.length===0) return;
    md += `## ${cat}\n\n`;
    items.forEach((it, idx) => {
      const id = `i-${cat}-${idx}`.replace(/\s+/g,'-');
      const checked = saved[id] ? 'x' : ' ';
      md += `- [${checked}] ${it}\n`;
    });
    md += `\n`;
  });
  return md;
}


/**
// Экспортирует список необходимых вещей в загружаемый файл Markdown.
// Использует API Blob и запускает загрузку файла в браузере
*/
function exportCurrentList(){
  const days = parseInt(document.getElementById('days').value,10) || 1;
  const type = document.getElementById('tripType').value;
  const temp = document.getElementById('temp').value;
  const categories = generatePacking(days,type,temp);
  if (!categories) return;
  const storageKey = `packed:${days}:${type}:${temp}`;
  const md = buildMarkdown(days,type,temp,categories,storageKey);
  const blob = new Blob([md], {type: 'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `packing-${days}d-${type}-${temp}.md`;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 500);
}

/**
// Обработчики событий пользовательского интерфейса для приложения «Умный список вещей».
// Обрабатывают:
// - Отправку формы (генерация списка вещей)
// - Очистку сохраненного состояния списка вещей
// - Печать списка вещей
// - Генерацию случайной поездки
// - Восстановление сохраненного состояния при загрузке страницы
// Используют localStorage для сохранения данных:
// - 'prefs' хранит настройки пользователя (дни, тип, температура)
// - 'packed:*' хранит состояния флажков для каждой конфигурации
*/

// Генерирует список вещей на основе введенных пользователем данных и сохраняет настройки в localStorage
document.getElementById("prefs").addEventListener("submit", (e) => {
  e.preventDefault();

  const days = parseInt(document.getElementById('days').value,10) || 1;
  const type = document.getElementById('tripType').value;
  const temp = document.getElementById('temp').value;
  const categories = generatePacking(days,type,temp);
  const storageKey = `packed:${days}:${type}:${temp}`;
  renderChecklist(categories, storageKey);
  localStorage.setItem('prefs', JSON.stringify({days,type,temp}));
});

// Очищает текущий контрольный список и удаляет сохраненное состояние упаковки для текущей конфигурации из localStorage
document.getElementById("clear").addEventListener("click", () => {
  const days = parseInt(document.getElementById('days').value,10) || 1;
  const type = document.getElementById('tripType').value;
  const temp = document.getElementById('temp').value;
  const storageKey = `packed:${days}:${type}:${temp}`;
  localStorage.removeItem(storageKey);
  document.getElementById('checklist').innerHTML = '';
});


// Открывает диалоговое окно печати текущего контрольного списка в браузере
document.getElementById("print").addEventListener("click", () => {
  window.print();
});

// Выбирает случайный тип поездки для быстрого создания списка
document.getElementById("random").addEventListener("click", () => {
  const random = randomTrips[Math.floor(Math.random() * randomTrips.length)];
  document.getElementById("tripType").value = random;
});

document.getElementById("exportMd").addEventListener("click", exportCurrentList);

// Восстанавливает сохраненные пользовательские настройки и генерирует контрольный список заново при загрузке страницы
window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("prefs") || "null");

  if (saved && saved.days) {
    document.getElementById("days").value = saved.days;
    document.getElementById("tripType").value = saved.type;
    document.getElementById("temp").value = saved.temp;

    const categories = generatePacking(saved.days, saved.type, saved.temp);
    const storageKey = `packed:${saved.days}:${saved.type}:${saved.temp}`;

    renderChecklist(categories, storageKey);
  }
});
