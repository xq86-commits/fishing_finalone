const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// 需要压缩的文件列表
const filesToCompress = [
  'games/game.js',
  'n1_vocab.json',
  'n2_vocab.json',
  'n3_vocab.json',
  'n4_vocab.json',
  'n5_vocab.json'
];

function compressFile(filePath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  跳过不存在的文件: ${filePath}`);
      return resolve();
    }
    
    const originalSize = fs.statSync(fullPath).size;
    const input = fs.createReadStream(fullPath);
    const output = fs.createWriteStream(fullPath + '.gz');
    const gzip = zlib.createGzip({ level: 9 }); // 最高压缩级别
    
    input.pipe(gzip).pipe(output);
    
    output.on('finish', () => {
      const compressedSize = fs.statSync(fullPath + '.gz').size;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      const saved = ((originalSize - compressedSize) / 1024).toFixed(1);
      console.log(`✓ ${filePath}`);
      console.log(`  原始: ${(originalSize/1024).toFixed(1)}KB → 压缩后: ${(compressedSize/1024).toFixed(1)}KB`);
      console.log(`  减少: ${saved}KB (${ratio}%)\n`);
      resolve();
    });
    
    output.on('error', (err) => {
      console.error(`✗ 压缩失败 ${filePath}:`, err.message);
      reject(err);
    });
  });
}

async function compressAll() {
  console.log('🚀 开始压缩文件...\n');
  
  let totalOriginal = 0;
  let totalCompressed = 0;
  
  for (const file of filesToCompress) {
    try {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        const originalSize = fs.statSync(fullPath).size;
        await compressFile(file);
        const compressedSize = fs.existsSync(fullPath + '.gz') 
          ? fs.statSync(fullPath + '.gz').size 
          : 0;
        totalOriginal += originalSize;
        totalCompressed += compressedSize;
      }
    } catch (error) {
      console.error(`处理 ${file} 时出错:`, error.message);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 压缩统计:');
  console.log(`  总原始大小: ${(totalOriginal/1024).toFixed(1)}KB`);
  console.log(`  总压缩大小: ${(totalCompressed/1024).toFixed(1)}KB`);
  console.log(`  节省空间: ${((totalOriginal - totalCompressed)/1024).toFixed(1)}KB`);
  console.log(`  压缩率: ${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ 压缩完成！');
  console.log('\n💡 提示:');
  console.log('  - 压缩后的文件以 .gz 结尾');
  console.log('  - 原始文件保持不变');
  console.log('  - 如果使用 GitHub Pages，可能需要配置服务器支持 .gz 文件');
}

compressAll().catch(console.error);

