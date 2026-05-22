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

function qtyLabel(name, count){
  return count>1?`${name} (${count})`:name;
}

//  GENERATE

function generatePacking(days, type, temp){
  const cat = {
    "Clothing":[],
    "Toiletries":[],
    "Electronics":[],
    "Misc":[]
  };

  // base logic
  const underwear = days;
  const socks = days;
  const shirts = Math.ceil(days);
  const pants = Math.ceil(days/2);

  cat.Clothing.push(qtyLabel('Underwear',underwear));
  cat.Clothing.push(qtyLabel('Socks',socks));
  cat.Clothing.push(qtyLabel('Shirts',shirts));
  cat.Clothing.push(qtyLabel('Pants',pants));
  cat.Clothing.push('Sleepwear');

  // apply rules
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

  // fixed items
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

function renderChecklist(categories, storageKey){
  const container = document.getElementById('checklist');
  
  // EMPTY STATE
  if (!categories) {
    container.innerHTML = "<p>Generate your packing list ✈️</p>";
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

      // restore saved state
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

// build markdown from categories and saved packed state
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

// export current packing list as Markdown file
function exportCurrentList(){
  const days = parseInt(document.getElementById('days').value,10) || 1;
  const type = document.getElementById('tripType').value;
  const temp = document.getElementById('temp').value;
  const categories = generatePacking(days,type,temp);
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

//EVENTS
document.getElementById("prefs").addEventListener("submit", (e) => {
  e.preventDefault();

  const days = parseInt(document.getElementById('days').value,10) || 1;
  const type = document.getElementById('tripType').value;
  const temp = document.getElementById('temp').value;
  const categories = generatePacking(days,type,temp);
  const storageKey = `packed:${days}:${type}:${temp}`;
  renderChecklist(categories, storageKey);
  // persist current preferences so we can restore on reload
  localStorage.setItem('prefs', JSON.stringify({days,type,temp}));
});

// CLEAR
document.getElementById("clear").addEventListener("click", () => {
  const days = parseInt(document.getElementById('days').value,10) || 1;
  const type = document.getElementById('tripType').value;
  const temp = document.getElementById('temp').value;
  const storageKey = `packed:${days}:${type}:${temp}`;
  localStorage.removeItem(storageKey);
  document.getElementById('checklist').innerHTML = '';
});


// PRINT
document.getElementById("print").addEventListener("click", () => {
  window.print();
});

// RANDOM TRIP
document.getElementById("random").addEventListener("click", () => {
  const random = randomTrips[Math.floor(Math.random() * randomTrips.length)];
  document.getElementById("tripType").value = random;
});

// INIT
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
