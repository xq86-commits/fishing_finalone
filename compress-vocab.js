const fs = require('fs');
const path = require('path');

// 字段映射：长字段名 -> 短字段名
const fieldMap = {
  'furigana': 'f',
  'english': 'e',
  'chinese': 'c',
  'korean': 'k',
  'spanish': 's',
  'french': 'fr'
};

// 反向映射：短字段名 -> 长字段名（用于验证）
const reverseFieldMap = {
  'f': 'furigana',
  'e': 'english',
  'c': 'chinese',
  'k': 'korean',
  's': 'spanish',
  'fr': 'french'
};

function compressVocabFile(inputPath, outputPath) {
  console.log(`正在压缩 ${inputPath}...`);
  
  // 读取原始文件
  const content = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(content);
  
  // 压缩数据
  const compressed = data.map(item => {
    const compressedItem = {};
    
    // 不保留 id 字段（进一步压缩）
    // if (item.id !== undefined) {
    //   compressedItem.id = item.id;
    // }
    
    // 转换字段名（支持长字段名和短字段名）
    for (const [longKey, shortKey] of Object.entries(fieldMap)) {
      // 如果存在长字段名，转换为短字段名
      if (item[longKey] !== undefined && item[longKey] !== null && item[longKey] !== '') {
        compressedItem[shortKey] = item[longKey];
      }
      // 如果已经是短字段名，直接保留
      else if (item[shortKey] !== undefined && item[shortKey] !== null && item[shortKey] !== '') {
        compressedItem[shortKey] = item[shortKey];
      }
    }
    
    return compressedItem;
  });
  
  // 写入压缩后的文件（紧凑格式，无空格）
  const compressedJson = JSON.stringify(compressed);
  fs.writeFileSync(outputPath, compressedJson, 'utf8');
  
  // 计算压缩率
  const originalSize = fs.statSync(inputPath).size;
  const compressedSize = fs.statSync(outputPath).size;
  const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(2);
  
  console.log(`  ✓ 原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`  ✓ 压缩后大小: ${(compressedSize / 1024).toFixed(2)} KB`);
  console.log(`  ✓ 减少: ${reduction}%`);
  console.log('');
  
  return { originalSize, compressedSize, reduction };
}

// 处理所有词汇文件
const vocabFiles = ['n1_vocab.json', 'n2_vocab.json', 'n3_vocab.json', 'n4_vocab.json', 'n5_vocab.json'];
const baseDir = __dirname;

let totalOriginal = 0;
let totalCompressed = 0;

vocabFiles.forEach(filename => {
  const inputPath = path.join(baseDir, filename);
  const outputPath = path.join(baseDir, filename);
  
  if (fs.existsSync(inputPath)) {
    // 备份原文件
    const backupPath = path.join(baseDir, filename + '.backup');
    fs.copyFileSync(inputPath, backupPath);
    console.log(`已备份原文件到: ${backupPath}`);
    
    const stats = compressVocabFile(inputPath, outputPath);
    totalOriginal += stats.originalSize;
    totalCompressed += stats.compressedSize;
  } else {
    console.log(`⚠ 文件不存在: ${filename}`);
  }
});

console.log('='.repeat(50));
console.log(`总计:`);
console.log(`  原始总大小: ${(totalOriginal / 1024).toFixed(2)} KB`);
console.log(`  压缩后总大小: ${(totalCompressed / 1024).toFixed(2)} KB`);
console.log(`  总减少: ${((1 - totalCompressed / totalOriginal) * 100).toFixed(2)}%`);
console.log('');
console.log('✓ 所有文件已压缩完成！');
console.log('✓ 原文件已备份为 .backup 文件');

