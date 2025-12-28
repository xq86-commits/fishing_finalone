const fs = require('fs');
const https = require('https');

// 读取配置
const config = JSON.parse(fs.readFileSync('translate-config.json', 'utf8'));
const cacheFile = 'translate-cache.json';
let translationCache = {};

// 加载缓存
if (fs.existsSync(cacheFile)) {
  try {
    translationCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch (e) {
    console.log('缓存文件损坏，将创建新缓存');
  }
}

// DeepL API 翻译函数
function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    const cacheKey = `deepl:${targetLang}:${text}`;
    
    // 检查缓存
    if (translationCache[cacheKey]) {
      resolve(translationCache[cacheKey]);
      return;
    }

    const langMap = {
      'chinese': 'ZH',
      'korean': 'KO',
      'spanish': 'ES',
      'french': 'FR'
    };

    const target = langMap[targetLang];
    if (!target) {
      reject(new Error(`不支持的语言: ${targetLang}`));
      return;
    }

    const postData = JSON.stringify({
      text: [text],
      target_lang: target
    });

    const options = {
      hostname: config.deepl.endpoint.replace('https://', ''),
      path: '/v2/translate',
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${config.deepl.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`API错误: ${res.statusCode} - ${data}`));
            return;
          }
          const result = JSON.parse(data);
          if (result.translations && result.translations[0]) {
            const translated = result.translations[0].text;
            // 保存到缓存
            translationCache[cacheKey] = translated;
            resolve(translated);
          } else {
            reject(new Error(`翻译响应格式错误: ${JSON.stringify(result)}`));
          }
        } catch (e) {
          reject(new Error(`解析错误: ${e.message}, 响应: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 翻译单个词汇条目
async function translateEntry(entry, languages = ['chinese', 'korean', 'spanish', 'french']) {
  const english = entry.english;
  if (!english) return entry;

  const result = { ...entry };

  for (const lang of languages) {
    // 如果已经有翻译，跳过
    if (result[lang]) continue;

    try {
      const translated = await translateText(english, lang);
      result[lang] = translated;
      
      // 保存缓存
      fs.writeFileSync(cacheFile, JSON.stringify(translationCache, null, 2));
      
      // 遵守速率限制，增加延迟以避免429错误
      await delay(500); // 每500ms一次请求，约2 requests/second
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('速率限制')) {
        console.error(`翻译失败 [${lang}]: ${english} - 速率限制，等待5秒后重试...`);
        // 如果遇到429错误，等待更长时间后重试
        await delay(5000);
        try {
          const translated = await translateText(english, lang);
          result[lang] = translated;
          fs.writeFileSync(cacheFile, JSON.stringify(translationCache, null, 2));
          await delay(500); // 重试后也要延迟
        } catch (retryError) {
          console.error(`重试失败 [${lang}]: ${english}`, retryError.message);
          result[lang] = english;
        }
      } else {
        console.error(`翻译失败 [${lang}]: ${english}`, error.message);
        // 如果翻译失败，使用英文作为后备
        result[lang] = english;
      }
    }
  }

  return result;
}

// 处理整个文件
async function translateFile(filename) {
  console.log(`\n开始处理文件: ${filename}`);
  
  const content = fs.readFileSync(filename, 'utf8');
  // Some source files may contain NaN; replace with null before parsing
  const safeText = content.replace(/\bNaN\b/g, "null");
  const data = JSON.parse(safeText);
  
  let processed = 0;
  let needsTranslation = 0;
  
  // 统计需要翻译的数量
  for (const entry of data) {
    if (!entry.chinese || !entry.korean || !entry.spanish || !entry.french) {
      needsTranslation++;
    }
  }
  
  console.log(`总共 ${data.length} 条，需要翻译 ${needsTranslation} 条`);
  
  // 批量处理
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    
    // 检查是否需要翻译
    const needsTranslation = !entry.chinese || !entry.korean || !entry.spanish || !entry.french;
    
    if (needsTranslation) {
      console.log(`[${i + 1}/${data.length}] 翻译: ${entry.english || entry.furigana}`);
      data[i] = await translateEntry(entry);
      processed++;
      
      // 每处理10条保存一次
      if (processed % 10 === 0) {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
        console.log(`已保存进度 (${processed}/${needsTranslation})`);
      }
    }
  }
  
  // 最终保存
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n完成! 已处理 ${processed} 条翻译`);
}

// 主函数
async function main() {
  const files = [
    'n4_vocab.json',
    'n5_vocab.json'
  ];

  for (const file of files) {
    if (fs.existsSync(file)) {
      await translateFile(file);
    } else {
      console.log(`文件不存在: ${file}`);
    }
  }
  
  console.log('\n所有文件处理完成!');
}

// 运行
main().catch(console.error);

