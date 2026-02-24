/***** CONFIG *****/
const SHEET_PRODUCTS = "Прайс";
const SHEET_QA = "Вопросы ИИ";
// Ключ хранится в Project Settings → Script properties → OPENAI_API_KEY
const OPENAI_API_KEY =
  PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY') ||
  "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";

/***** Helpers *****/
function _ss()          { return SpreadsheetApp.getActiveSpreadsheet(); }
function _sheet(name)   { return _ss().getSheetByName(name); }
function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Нормализация заголовка: убирает пробелы и двоеточие на конце, приводит к нижнему регистру
function _normHeader(h) {
  return String(h).trim().replace(/[:\s]+$/, '').toLowerCase();
}

/***** DATA *****/

// Возвращает [[name, group, imageUrl], ...] — список всех продуктов
function apiGetProducts() {
  const sh = _sheet(SHEET_PRODUCTS);
  if (!sh) throw new Error('Не найден лист "' + SHEET_PRODUCTS + '"');
  const last = sh.getLastRow();
  if (last < 2) return [];

  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  // Ищем колонку с фото
  const photoColIdx = headers.findIndex(function(h) {
    var hl = _normHeader(h);
    return hl === 'фото' || hl === 'photo' || hl === 'фотография';
  });

  var numCols = photoColIdx >= 0 ? Math.max(2, photoColIdx + 1) : 2;
  var data = sh.getRange(2, 1, last - 1, numCols).getValues();

  var result = [];
  for (var i = 0; i < data.length; i++) {
    var name  = String(data[i][0]).trim();
    var group = String(data[i][1]).trim() || 'Общее';
    var image = photoColIdx >= 0 ? String(data[i][photoColIdx] || '').trim() : '';
    if (name !== '') result.push([name, group, image]);
  }
  return result;
}

// Возвращает объект с полными данными одного продукта (все столбцы)
function apiGetProductInfo(name) {
  var sh = _sheet(SHEET_PRODUCTS);
  var rows = sh.getDataRange().getValues();
  var headers = rows[0];

  // ВАЖНО: rows.slice(1) — пропускаем заголовочную строку
  var row = rows.slice(1).find(function(r) {
    return String(r[0]).trim() === String(name).trim();
  });
  if (!row) return {};

  var obj = {};
  headers.forEach(function(h, i) {
    var key = String(h).trim().replace(/[:\s]+$/, ''); // убираем двоеточие из заголовка
    var val = row[i];
    if (val instanceof Date) {
      obj[key] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd.MM.yyyy');
    } else {
      obj[key] = (val !== null && val !== undefined) ? String(val) : '';
    }
  });
  return obj;
}

// Возвращает историю вопросов/ответов по продукту
function apiGetHistory(name, limit) {
  var sh = _sheet(SHEET_QA);
  if (!sh) return [];
  var values = sh.getDataRange().getValues(); // Дата | Продукт | Вопрос | Ответ
  var res = [];
  for (var i = 1; i < values.length; i++) {
    var dt   = values[i][0];
    var prod = values[i][1];
    var q    = values[i][2];
    var a    = values[i][3];
    if (String(prod).trim() === String(name).trim()) {
      var dateStr = dt instanceof Date
        ? Utilities.formatDate(dt, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm')
        : String(dt);
      res.push({ timestamp: dateStr, question: q, answer: a });
    }
  }
  res.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
  return res.slice(0, limit || 20);
}

// Возвращает агрегированные данные для вкладки Аналитика
// groupFilter — опциональный фильтр по группе
function apiGetAnalytics(groupFilter) {
  var sh = _sheet(SHEET_PRODUCTS);
  var rows = sh.getDataRange().getValues();
  var headers = rows[0].map(_normHeader);

  function idx(name) { return headers.indexOf(name); }
  var iGroup  = idx('группы') >= 0 ? idx('группы') : idx('группа');
  var iMaker  = idx('производитель');
  var iStatus = idx('статус продукта') >= 0 ? idx('статус продукта') : idx('статус');
  var iCond   = idx('условия отпуска');

  var filterGroup = groupFilter ? String(groupFilter).trim().toLowerCase() : '';

  var total = 0;
  var newProducts = [];
  var groupMap = {};
  var countryMap = {};
  var condMap = {};

  for (var i = 1; i < rows.length; i++) {
    var name = String(rows[i][0]).trim();
    if (!name) continue;

    // Применяем фильтр по группе если задан
    if (filterGroup && iGroup >= 0) {
      var rowGroup = String(rows[i][iGroup]).trim().toLowerCase();
      if (rowGroup !== filterGroup) continue;
    }

    total++;

    // Новые продукты (Статус == "Новый")
    if (iStatus >= 0) {
      var status = String(rows[i][iStatus]).trim();
      if (status === 'Новый') {
        var grp = iGroup >= 0 ? String(rows[i][iGroup]).trim() : '';
        newProducts.push({ name: name, group: grp });
      }
    }

    // По группе
    if (iGroup >= 0) {
      var g = String(rows[i][iGroup]).trim() || 'Без группы';
      groupMap[g] = (groupMap[g] || 0) + 1;
    }

    // По стране производителя (вторая строка ячейки после \n)
    if (iMaker >= 0) {
      var makerVal = String(rows[i][iMaker]).trim();
      var lines = makerVal.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; });
      var country = lines.length >= 2 ? lines[lines.length - 1] : (lines[0] || '');
      if (country) {
        if (!countryMap[country]) countryMap[country] = { count: 0, products: [] };
        countryMap[country].count++;
        countryMap[country].products.push({
          name: name,
          group: iGroup >= 0 ? String(rows[i][iGroup]).trim() : ''
        });
      }
    }

    // По условиям отпуска
    if (iCond >= 0) {
      var cond = String(rows[i][iCond]).trim() || 'Не указано';
      condMap[cond] = (condMap[cond] || 0) + 1;
    }
  }

  function toSortedArray(obj) {
    return Object.entries(obj)
      .map(function(e) { return { label: e[0], count: e[1] }; })
      .sort(function(a, b) { return b.count - a.count; });
  }

  var byCountry = Object.entries(countryMap)
    .map(function(e) {
      return { label: e[0], count: e[1].count, products: e[1].products };
    })
    .sort(function(a, b) { return b.count - a.count; });

  return {
    total:        total,
    newProducts:  newProducts,
    byGroup:      toSortedArray(groupMap),
    byCountry:    byCountry,
    byConditions: toSortedArray(condMap)
  };
}

/***** AI *****/
function apiAsk(name, question) {
  try {
    var productInfo = apiGetProductInfo(name);

    var context = [
      'Название: '                                   + name,
      'Международное непатентованное название: '     + (productInfo['Международное непатентованное название'] || '-'),
      'Форма выпуска: '                              + (productInfo['Лекарственная форма и форма выпуска'] || '-'),
      'Условия отпуска: '                            + (productInfo['Условия отпуска'] || '-'),
      'Показания к применению: '                     + (productInfo['Показания к применению'] || '-'),
      'Способ применения и дозы: '                   + (productInfo['Способ применения и дозы'] || productInfo['Характеристики дозы'] || '-'),
      'Беременность и лактация: '                    + (productInfo['Беременность и лактация'] || '-'),
      'Состав: '                                     + (productInfo['Состав'] || '-'),
    ].join('\n');

    var resp = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_API_KEY
      },
      payload: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'Ты — медицинский ассистент компании. Отвечаешь медицинскому представителю, используя только данные из инструкции к препарату. Разрешено делать логичные выводы на основе показаний, состава, механизма действия, формы выпуска и целевой группы, даже если это прямо не указано в инструкции (например, какие врачи могут назначить препарат). Не выдумывай фактов. Если информации недостаточно, прямо укажи это и добавь фразу вида: «В инструкции нет прямых данных, но исходя из представленной информации можно предположить…». Отвечай кратко, профессионально и только в рамках инструкции. Если вопрос задан на таджикском языке — отвечай также на таджикском.'
          },
          {
            role: 'user',
            content: context + '\n\nВопрос: ' + question
          }
        ]
      }),
      muteHttpExceptions: true
    });

    var json = JSON.parse(resp.getContentText());
    if (!json.choices) throw new Error(resp.getContentText());
    var answer = json.choices[0].message.content;

    var sh = _ss().getSheetByName(SHEET_QA);
    if (!sh) {
      sh = _ss().insertSheet(SHEET_QA);
      sh.appendRow(['Дата', 'Продукт', 'Вопрос', 'Ответ']);
    }
    sh.appendRow([new Date(), name, question, answer]);

    return { ok: true, answer: answer };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/***** ROUTER *****/
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action ? e.parameter.action : 'products').toLowerCase();
    if (action === 'products')  return _json({ ok: true, data: apiGetProducts() });
    if (action === 'product')   return _json({ ok: true, data: apiGetProductInfo(e.parameter.name || '') });
    if (action === 'history')   return _json({ ok: true, data: apiGetHistory(e.parameter.name || '', Number(e.parameter.limit) || 20) });
    if (action === 'analytics') return _json({ ok: true, data: apiGetAnalytics(e.parameter.group || '') });
    return _json({ ok: false, error: 'Unknown GET action' });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var data = {};
    if (e.postData && e.postData.type &&
        String(e.postData.type).toLowerCase().indexOf('application/json') !== -1) {
      data = JSON.parse(e.postData.contents || '{}');
    } else {
      data = {
        action:   e.parameter.action,
        name:     e.parameter.name,
        question: e.parameter.question
      };
    }

    if ((data.action || '').toLowerCase() === 'ask') {
      if (!data.name || !data.question) throw new Error('name и question обязательны');
      return _json(apiAsk(String(data.name), String(data.question)));
    }
    return _json({ ok: false, error: 'Unknown POST action' });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}
