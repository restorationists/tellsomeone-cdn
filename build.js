#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const chokidar = require('chokidar');
const { minify } = require('html-minifier-terser');

// Configuration
const config = {
  distDir: 'dist',
  devDir: '.dev',
  layoutsDir: 'layouts',
  partialsDir: 'partials',
  assetsDir: 'assets',
  siteConfigFile: 'site.json',
  port: 3000
};

class SiteGenerator {
  constructor(options = {}) {
    this.mode = options.mode || 'development';
    this.watch = options.watch || false;
    this.serve = options.serve || false;
    this.outputDir = this.mode === 'production' ? config.distDir : config.devDir;
    this.siteConfig = null;
    this.watchers = [];
  }

  async init() {
    console.log(`🚀 Building site in ${this.mode} mode...`);
    
    // Load site configuration
    await this.loadSiteConfig();
    
    // Clean output directory
    await this.cleanOutput();
    
    // Build site
    await this.buildSite();
    
    if (this.mode === 'development') {
      if (this.watch) {
        this.setupWatchers();
      }
      if (this.serve) {
        this.startDevServer();
      }
    }
  }

  async loadSiteConfig() {
    try {
      const configContent = await fs.readFile(config.siteConfigFile, 'utf-8');
      this.siteConfig = JSON.parse(configContent);
      console.log(`✅ Loaded site config with ${this.siteConfig.pages.length} pages`);
    } catch (error) {
      console.error('❌ Failed to load site.json:', error.message);
      process.exit(1);
    }
  }

  async cleanOutput() {
    try {
      await fs.rm(this.outputDir, { recursive: true, force: true });
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`🧹 Cleaned ${this.outputDir}`);
    } catch (error) {
      console.error('❌ Failed to clean output directory:', error.message);
    }
  }

  async buildSite() {
    try {
      // Build pages
      await this.buildPages();
      
      // Copy assets
      await this.copyAssets();
      
      // Process CSS (Tailwind)
      await this.processCss();
      
      // Generate SEO files
      await this.generateSeoFiles();
      
      console.log(`✅ Site built successfully to ${this.outputDir}`);
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      throw error;
    }
  }

  async buildPages() {
    const layoutPath = path.join(config.layoutsDir, 'v1.html');
    const layoutContent = await fs.readFile(layoutPath, 'utf-8');

    for (const page of this.siteConfig.pages) {
      await this.buildPage(page, layoutContent);
    }
  }

  async buildPage(page, layoutContent) {
    try {
      // Load partial content
      const partialPath = path.join(config.partialsDir, page.template);
      const partialContent = await fs.readFile(partialPath, 'utf-8');

      // Prepare template variables
      const templateVars = {
        ...page,
        config: this.siteConfig.config,
        content: partialContent,
        keywords_string: Array.isArray(page.keywords) ? page.keywords.join(', ') : '',
        css_links: Array.isArray(page.css_files) ? page.css_files.map(file => `    <link href="/${file}" rel="stylesheet">`).join('\n') : '',
        js_links: Array.isArray(page.js_files) ? page.js_files.map(file => `    <script src="/${file}"></script>`).join('\n') : ''
      };

      // Process template
      let htmlContent = this.processTemplate(layoutContent, templateVars);

      // Minify in production
      if (this.mode === 'production') {
        htmlContent = await minify(htmlContent, {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
          minifyURLs: true,
          processScripts: ['application/ld+json'],
          ignoreCustomFragments: [/<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/]
        });
      }

      // Write output file
      const outputPath = path.join(this.outputDir, page.output);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, htmlContent);

      console.log(`📄 Built ${page.id} → ${page.output}`);
    } catch (error) {
      console.error(`❌ Failed to build page ${page.id}:`, error.message);
      throw error;
    }
  }

  processTemplate(template, vars) {
    let processed = template;

    // Replace {{ content }} first
    processed = processed.replace(/\{\{\s*content\s*\}\}/g, vars.content);

    // Replace other variables
    processed = processed.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      try {
        // Handle array methods like keywords.join(', ')
        if (expression.includes('.join(')) {
          const joinMatch = expression.match(/(.+?)\.join\(['"](.+?)['"]\)/);
          if (joinMatch) {
            const [, arrayPath, separator] = joinMatch;
            const array = this.getNestedProperty(vars, arrayPath.trim());
            return Array.isArray(array) ? array.join(separator) : '';
          }
        }
        
        // Handle conditional array methods like css_files.map()
        if (expression.includes('.map(')) {
          const mapMatch = expression.match(/(.+?)\s*\?\s*(.+?)\.map\((.+?)\)\.join\(['"](.+?)['"]\)\s*:\s*['"](.*?)['"]/);
          if (mapMatch) {
            const [, arrayPath, , mapFunction, joinSeparator, fallback] = mapMatch;
            const array = this.getNestedProperty(vars, arrayPath.trim());
            
            if (Array.isArray(array) && array.length > 0) {
              // Extract the template from the map function
              const templateMatch = mapFunction.match(/`([^`]+)`/);
              if (templateMatch) {
                const template = templateMatch[1];
                const results = array.map(file => template.replace(/\$\{file\}/g, file));
                return results.join(joinSeparator);
              }
            }
            return fallback || '';
          }
        }
        
        // Handle simple property access and basic conditionals
        if (expression.includes('?')) {
          // Handle ternary operators like: current_page === 'home' ? 'active' : ''
          return this.evaluateExpression(expression, vars);
        } else if (expression.includes('||')) {
          // Handle OR expressions like: og_image || config.default_image
          const parts = expression.split('||').map(p => p.trim());
          for (const part of parts) {
            const value = this.getNestedProperty(vars, part);
            if (value) return value;
          }
          return '';
        } else {
          // Simple property access
          return this.getNestedProperty(vars, expression.trim()) || '';
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process template expression: ${expression}`);
        return '';
      }
    });

    return processed;
  }

  evaluateExpression(expression, vars) {
    // Handle ternary operators: condition ? value1 : value2
    const ternaryMatch = expression.match(/(.+?)\s*\?\s*(.+?)\s*:\s*(.+)/);
    if (ternaryMatch) {
      const [, condition, trueValue, falseValue] = ternaryMatch;
      
      // Handle equality checks: current_page === 'home'
      const equalityMatch = condition.match(/(.+?)\s*===\s*['"](.+?)['"]/);
      if (equalityMatch) {
        const [, leftSide, rightSide] = equalityMatch;
        const leftValue = this.getNestedProperty(vars, leftSide.trim());
        const result = leftValue === rightSide;
        
        if (result) {
          return trueValue.replace(/['"]/g, '');
        } else {
          return falseValue.replace(/['"]/g, '');
        }
      }
    }
    
    return '';
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : null;
    }, obj);
  }

  async copyAssets() {
    try {
      const assetsPath = config.assetsDir;
      const outputAssetsPath = path.join(this.outputDir, config.assetsDir);
      
      // Check if assets directory exists
      try {
        await fs.access(assetsPath);
      } catch {
        console.log('📁 No assets directory found, skipping...');
        return;
      }

      // Files/directories to exclude from assets copy
      const excludeFromAssets = [
        'design'
      ];

      // Copy all assets to assets/ directory (excluding specified items)
      await this.copyDirectory(assetsPath, outputAssetsPath, excludeFromAssets);
      
      // Minify CSS and JS files in production
      if (this.mode === 'production') {
        await this.minifyAssets(outputAssetsPath);
      }
      
      // Files that need to be copied to root directory
      const rootFiles = [
        'site.webmanifest'
      ];
      
      // Copy specific files to root
      for (const fileName of rootFiles) {
        const srcFile = path.join(assetsPath, fileName);
        const destFile = path.join(this.outputDir, fileName);
        
        try {
          await fs.access(srcFile);
          await fs.copyFile(srcFile, destFile);
          console.log(`📁 Copied ${fileName} to root`);
          
          // Delete from assets directory in output
          const assetsCopy = path.join(outputAssetsPath, fileName);
          try {
            await fs.unlink(assetsCopy);
            console.log(`📁 Removed ${fileName} from assets/`);
          } catch {
            // File might not exist, ignore
          }
        } catch {
          // File doesn't exist, skip silently
        }
      }
      
      console.log('📁 Assets copied');
    } catch (error) {
      console.error('❌ Failed to copy assets:', error.message);
    }
  }

  async copyDirectory(src, dest, excludeList = []) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      // Skip excluded files/directories
      if (excludeList.includes(entry.name)) {
        console.log(`📁 Skipping excluded: ${entry.name}`);
        continue;
      }

      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, excludeList);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async minifyAssets(assetsPath) {
    try {
      await this.minifyDirectory(assetsPath);
      console.log('🗜️  Assets minified');
    } catch (error) {
      console.error('❌ Failed to minify assets:', error.message);
    }
  }

  async minifyDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.minifyDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          
          if (ext === '.css') {
            await this.minifyCssFile(fullPath);
          } else if (ext === '.js') {
            await this.minifyJsFile(fullPath);
          } else if (ext === '.html') {
            await this.minifyHtmlFile(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to process directory ${dirPath}:`, error.message);
    }
  }

  async minifyHtmlFile(filePath) {
    try {
      let html = await fs.readFile(filePath, 'utf-8');
      
      // Minify JSON-LD blocks
      html = html.replace(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g, (match, jsonContent) => {
        try {
          const parsed = JSON.parse(jsonContent);
          const minified = JSON.stringify(parsed);
          return `<script type="application/ld+json">${minified}</script>`;
        } catch (error) {
          console.warn(`⚠️  Failed to minify JSON-LD in ${filePath}`);
          return match; // Return original if parsing fails
        }
      });
      
      await fs.writeFile(filePath, html);
      console.log(`🗜️  Minified JSON-LD in: ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`❌ Failed to minify HTML ${filePath}:`, error.message);
    }
  }

  async minifyCssFile(filePath) {
    try {
      const cssnano = require('cssnano');
      const postcss = require('postcss');
      
      const css = await fs.readFile(filePath, 'utf-8');
      const result = await postcss([cssnano()]).process(css, { from: filePath });
      
      await fs.writeFile(filePath, result.css);
      console.log(`🗜️  Minified CSS: ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`❌ Failed to minify CSS ${filePath}:`, error.message);
    }
  }

  async minifyJsFile(filePath) {
    try {
      const { minify } = require('terser');
      
      const js = await fs.readFile(filePath, 'utf-8');
      const result = await minify(js);
      
      if (result.code) {
        await fs.writeFile(filePath, result.code);
        console.log(`🗜️  Minified JS: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error(`❌ Failed to minify JS ${filePath}:`, error.message);
    }
  }

  async processCss() {
    try {
      const { spawn } = require('child_process');
      const inputCss = path.join(config.assetsDir, 'css', 'main.css');
      const outputCss = path.join(this.outputDir, config.assetsDir, 'css', 'main.css');
      
      // Check if input CSS exists
      try {
        await fs.access(inputCss);
      } catch {
        console.log('🎨 No main.css found, skipping CSS processing...');
        return;
      }

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputCss), { recursive: true });

      // Build Tailwind command
      const tailwindArgs = [
        'tailwindcss',
        '-i', inputCss,
        '-o', outputCss,
      ];

      if (this.mode === 'production') {
        tailwindArgs.push('--minify');
      }

      if (this.watch) {
        tailwindArgs.push('--watch');
      }

      // Run Tailwind CSS
      const tailwindProcess = spawn('npx', tailwindArgs, {
        stdio: this.watch ? 'pipe' : 'inherit'
      });

      if (!this.watch) {
        // Wait for completion in build mode
        await new Promise((resolve, reject) => {
          tailwindProcess.on('close', (code) => {
            if (code === 0) {
              console.log('🎨 CSS processed with Tailwind');
              resolve();
            } else {
              reject(new Error(`Tailwind process exited with code ${code}`));
            }
          });
        });
      } else {
        // In watch mode, let it run in background
        console.log('🎨 Tailwind CSS watching for changes...');
        this.tailwindProcess = tailwindProcess;
      }
    } catch (error) {
      console.error('❌ Failed to process CSS:', error.message);
    }
  }

  async generateSeoFiles() {
    try {
      // Generate sitemap.xml
      await this.generateSitemap();
      
      // Generate robots.txt
      await this.generateRobots();
      
      console.log('🔍 SEO files generated');
    } catch (error) {
      console.error('❌ Failed to generate SEO files:', error.message);
    }
  }

  async generateSitemap() {
    const { config: siteConfig, pages } = this.siteConfig;
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const page of pages) {
      const url = siteConfig.base_url + (page.canonical || '/' + page.output.replace('/index.html', '/'));
      sitemap += '  <url>\n';
      sitemap += `    <loc>${url}</loc>\n`;
      sitemap += `    <priority>${page.priority || 0.5}</priority>\n`;
      sitemap += `    <changefreq>${page.changefreq || 'monthly'}</changefreq>\n`;
      sitemap += '  </url>\n';
    }
    
    sitemap += '</urlset>';
    
    await fs.writeFile(path.join(this.outputDir, 'sitemap.xml'), sitemap);
  }

  async generateRobots() {
    const { robots } = this.siteConfig;
    
    let robotsTxt = `User-agent: ${robots.user_agent}\n`;
    
    if (robots.disallow.length > 0) {
      for (const disallow of robots.disallow) {
        robotsTxt += `Disallow: ${disallow}\n`;
      }
    }
    
    if (robots.sitemap) {
      robotsTxt += `\nSitemap: ${this.siteConfig.config.base_url}${robots.sitemap}`;
    }
    
    await fs.writeFile(path.join(this.outputDir, 'robots.txt'), robotsTxt);
  }

  setupWatchers() {
    console.log('👀 Setting up file watchers...');
    
    // Watch partials
    const partialsWatcher = chokidar.watch(
      path.join(config.partialsDir, '*.html')
    );
    partialsWatcher.on('change', this.handleFileChange.bind(this));
    this.watchers.push(partialsWatcher);

    // Watch layouts
    const layoutsWatcher = chokidar.watch(
      path.join(config.layoutsDir, '*.html')
    );
    layoutsWatcher.on('change', this.handleFileChange.bind(this));
    this.watchers.push(layoutsWatcher);

    // Watch site config
    const configWatcher = chokidar.watch(config.siteConfigFile);
    configWatcher.on('change', this.handleConfigChange.bind(this));
    this.watchers.push(configWatcher);

    console.log('✅ File watchers active');
  }

  async handleFileChange(filePath) {
    console.log(`🔄 File changed: ${filePath}`);
    try {
      await this.buildSite();
      if (this.serve) {
        this.broadcastReload();
      }
    } catch (error) {
      console.error('❌ Rebuild failed:', error.message);
    }
  }

  async handleConfigChange() {
    console.log('🔄 Config changed, reloading...');
    try {
      await this.loadSiteConfig();
      await this.buildSite();
      if (this.serve) {
        this.broadcastReload();
      }
    } catch (error) {
      console.error('❌ Config reload failed:', error.message);
    }
  }

  startDevServer() {
    const server = http.createServer(async (req, res) => {
      try {
        let filePath = req.url === '/' ? '/index.html' : req.url;
        
        // Remove query parameters
        filePath = filePath.split('?')[0];
        
        // Handle directory requests
        if (filePath.endsWith('/') && filePath !== '/') {
          filePath += 'index.html';
        }
        
        const fullPath = path.join(this.outputDir, filePath);
        
        try {
          const content = await fs.readFile(fullPath);
          const ext = path.extname(filePath);
          
          let contentType = 'text/html';
          if (ext === '.css') contentType = 'text/css';
          if (ext === '.js') contentType = 'application/javascript';
          if (ext === '.json') contentType = 'application/json';
          if (ext === '.png') contentType = 'image/png';
          if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          if (ext === '.svg') contentType = 'image/svg+xml';
          
          res.writeHead(200, { 'Content-Type': contentType });
          
          // Inject live reload script for HTML files
          if (contentType === 'text/html') {
            const htmlContent = content.toString();
            const liveReloadScript = `
              <script>
                const ws = new WebSocket('ws://localhost:${config.port + 1}');
                ws.onmessage = (event) => {
                  if (event.data === 'reload') {
                    window.location.reload();
                  }
                };
              </script>
            `;
            const modifiedHtml = htmlContent.replace('</body>', liveReloadScript + '</body>');
            res.end(modifiedHtml);
          } else {
            res.end(content);
          }
        } catch (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });

    server.listen(config.port, () => {
      console.log(`🌐 Dev server running at http://localhost:${config.port}`);
    });

    // Setup WebSocket for live reload
    this.setupLiveReload();
  }

  setupLiveReload() {
    const WebSocket = require('ws');
    this.wss = new WebSocket.Server({ port: config.port + 1 });
    console.log(`🔄 Live reload WebSocket on port ${config.port + 1}`);
  }

  broadcastReload() {
    if (this.wss) {
      this.wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send('reload');
        }
      });
    }
  }

  cleanup() {
    this.watchers.forEach(watcher => watcher.close());
    if (this.wss) {
      this.wss.close();
    }
    if (this.tailwindProcess) {
      this.tailwindProcess.kill();
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const options = {
    mode: args.includes('--mode=production') ? 'production' : 'development',
    watch: args.includes('--watch'),
    serve: args.includes('--serve')
  };

  const generator = new SiteGenerator(options);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    generator.cleanup();
    process.exit(0);
  });

  try {
    await generator.init();
    
    if (options.watch || options.serve) {
      console.log('Press Ctrl+C to stop');
    }
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SiteGenerator;